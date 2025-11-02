#!/usr/bin/env python3
"""
LoRA Training Script for Qwen2.5-coder using Unsloth

Trains a LoRA adapter on SFT datasets and exports to GGUF format for Ollama.

Usage:
    python train_lora.py --data .agent/sft/coder_sft.jsonl --output ./lora_adapter
    python train_lora.py --data .agent/sft/*.jsonl --base unsloth/qwen2.5-coder-7b-bnb-4bit --epochs 3
"""
import argparse
import json
import os
import sys
from typing import List
from datasets import Dataset
from unsloth import FastLanguageModel
from trl import SFTTrainer
from transformers import TrainingArguments
import torch


def load_jsonl_dataset(file_paths: List[str]) -> Dataset:
    """
    Load JSONL dataset from given file paths.
    
    Args:
        file_paths: List of paths to JSONL files
        
    Returns:
        Dataset object ready for training
        
    Raises:
        FileNotFoundError: If any file doesn't exist
        ValueError: If JSONL is invalid
    """
    data = []
    
    for file_path in file_paths:
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
            
        print(f"📂 Loading {file_path}...")
        
        with open(file_path, 'r', encoding='utf-8') as f:
            for line_num, line in enumerate(f, 1):
                line = line.strip()
                if not line:
                    continue
                    
                try:
                    obj = json.loads(line)
                    
                    # Validate required fields
                    if not all(k in obj for k in ['instruction', 'input', 'output']):
                        raise ValueError(f"Missing required fields in line {line_num}")
                    
                    # Format as instruction-input-response
                    formatted_text = {
                        "text": f"### Instruction:\n{obj['instruction']}\n\n### Input:\n{obj['input']}\n\n### Response:\n{obj['output']}"
                    }
                    data.append(formatted_text)
                    
                except json.JSONDecodeError as e:
                    raise ValueError(f"Invalid JSON in {file_path} line {line_num}: {e}")
    
    print(f"✅ Loaded {len(data)} examples from {len(file_paths)} file(s)")
    return Dataset.from_list(data)


def train_lora(
    data_files: List[str],
    base_model: str = 'unsloth/qwen2.5-coder-7b-bnb-4bit',
    rank: int = 16,
    epochs: int = 3,
    learning_rate: float = 2e-4,
    batch_size: int = 4,
    gradient_accumulation: int = 4,
    max_seq_length: int = 2048,
    output_dir: str = './lora_adapter'
) -> None:
    """
    Train LoRA adapter using Unsloth.
    
    Args:
        data_files: List of JSONL dataset files
        base_model: Base model name (Unsloth format)
        rank: LoRA rank
        epochs: Number of training epochs
        learning_rate: Learning rate
        batch_size: Per-device batch size
        gradient_accumulation: Gradient accumulation steps
        max_seq_length: Maximum sequence length
        output_dir: Output directory for adapter and GGUF
    """
    print("\n🚀 Starting LoRA training with Unsloth...")
    print(f"📊 Base model: {base_model}")
    print(f"📊 LoRA rank: {rank}")
    print(f"📊 Epochs: {epochs}")
    print(f"📊 Learning rate: {learning_rate}")
    print(f"📊 Batch size: {batch_size}")
    print(f"📊 Gradient accumulation: {gradient_accumulation}")
    print(f"📊 Max sequence length: {max_seq_length}\n")
    
    # Load dataset
    dataset = load_jsonl_dataset(data_files)
    
    # Load model and tokenizer with Unsloth
    print("🔧 Loading model with Unsloth...")
    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name=base_model,
        max_seq_length=max_seq_length,
        dtype=None,  # Auto-detect
        load_in_4bit=True,
    )
    
    # Add LoRA adapters
    print("🔧 Adding LoRA adapters...")
    model = FastLanguageModel.get_peft_model(
        model,
        r=rank,
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
        lora_alpha=16,
        lora_dropout=0,
        bias="none",
        use_gradient_checkpointing="unsloth",
        random_state=42,
    )
    
    # Training arguments
    training_args = TrainingArguments(
        output_dir=output_dir,
        per_device_train_batch_size=batch_size,
        gradient_accumulation_steps=gradient_accumulation,
        warmup_steps=10,
        num_train_epochs=epochs,
        learning_rate=learning_rate,
        fp16=not torch.cuda.is_bf16_supported(),
        bf16=torch.cuda.is_bf16_supported(),
        logging_steps=10,
        save_strategy="epoch",
        optim="adamw_8bit",
        weight_decay=0.01,
        lr_scheduler_type="linear",
        seed=42,
    )
    
    # Create trainer
    print("🏋️ Creating trainer...")
    trainer = SFTTrainer(
        model=model,
        tokenizer=tokenizer,
        train_dataset=dataset,
        dataset_text_field="text",
        max_seq_length=max_seq_length,
        args=training_args,
        packing=False,
    )
    
    # Train
    print("\n🏋️ Training...\n")
    trainer.train()
    
    # Get final metrics
    print("\n📊 Evaluating...")
    metrics = trainer.evaluate()
    print(f"✅ Training complete!")
    print(f"📊 Final loss: {metrics.get('eval_loss', 'N/A')}")
    
    # Save LoRA adapter
    print(f"\n💾 Saving LoRA adapter to {output_dir}...")
    model.save_pretrained(output_dir)
    tokenizer.save_pretrained(output_dir)
    
    # Export to GGUF
    print("\n📦 Exporting to GGUF format (Q8_0)...")
    gguf_path = os.path.join(output_dir, "unsloth.Q8_0.gguf")
    model.save_pretrained_gguf(
        output_dir,
        tokenizer,
        quantization_method="q8_0"
    )
    
    print("\n✅ All done!")
    print(f"📁 LoRA adapter: {output_dir}")
    print(f"📁 GGUF model: {gguf_path}")
    print("\n🚀 Next steps:")
    print(f"  1. Create Modelfile: python generate_modelfile.py --adapter {output_dir}")
    print(f"  2. Load in Ollama: ollama create my-model -f Modelfile")


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Train LoRA adapter for Qwen2.5-coder using Unsloth",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Train on single dataset
  python train_lora.py --data .agent/sft/coder_sft.jsonl --output ./lora_adapter
  
  # Train on multiple datasets
  python train_lora.py --data .agent/sft/*.jsonl --output ./lora_adapter
  
  # Custom settings
  python train_lora.py --data .agent/sft/coder_sft.jsonl --rank 32 --epochs 5 --output ./lora_adapter
        """
    )
    
    parser.add_argument('--data', nargs='+', required=True, help='Paths to JSONL dataset files')
    parser.add_argument('--base', default='unsloth/qwen2.5-coder-7b-bnb-4bit', help='Base model name')
    parser.add_argument('--rank', type=int, default=16, help='LoRA rank (default: 16)')
    parser.add_argument('--epochs', type=int, default=3, help='Number of training epochs (default: 3)')
    parser.add_argument('--lr', type=float, default=2e-4, help='Learning rate (default: 2e-4)')
    parser.add_argument('--batch-size', type=int, default=4, help='Per-device batch size (default: 4)')
    parser.add_argument('--grad-accum', type=int, default=4, help='Gradient accumulation steps (default: 4)')
    parser.add_argument('--max-seq-len', type=int, default=2048, help='Max sequence length (default: 2048)')
    parser.add_argument('--output', required=True, help='Output directory for trained model')
    
    args = parser.parse_args()
    
    try:
        train_lora(
            data_files=args.data,
            base_model=args.base,
            rank=args.rank,
            epochs=args.epochs,
            learning_rate=args.lr,
            batch_size=args.batch_size,
            gradient_accumulation=args.grad_accum,
            max_seq_length=args.max_seq_len,
            output_dir=args.output
        )
        
    except FileNotFoundError as e:
        print(f"\n❌ Error: {e}", file=sys.stderr)
        sys.exit(1)
    except ValueError as e:
        print(f"\n❌ Error: {e}", file=sys.stderr)
        sys.exit(1)
    except torch.cuda.OutOfMemoryError:
        print("\n❌ Error: CUDA out of memory. Try reducing --batch-size or --max-seq-len", file=sys.stderr)
        sys.exit(1)
    except ImportError as e:
        print(f"\n❌ Import error: {e}", file=sys.stderr)
        print("\nMake sure you have installed: pip install unsloth transformers datasets trl", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()

