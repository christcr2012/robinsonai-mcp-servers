/**
 * OpenAI Tool Definitions
 * Extracted from temp-openai-mcp.ts
 */

export const OPENAI_TOOLS = [
  // ==================== CHAT COMPLETIONS ====================
  {
    name: "openai_chat_completion",
    description: "Create a chat completion with GPT models (GPT-4, GPT-3.5, etc.)",
    inputSchema: {
      type: "object",
      properties: {
        model: {
          type: "string",
          description: "Model to use (e.g., gpt-4, gpt-4-turbo, gpt-3.5-turbo)",
          default: "gpt-4",
        },
        messages: {
          type: "array",
          description: "Array of message objects with role and content",
          items: {
            type: "object",
            properties: {
              role: { type: "string", enum: ["system", "user", "assistant"] },
              content: { type: "string" },
            },
          },
        },
        temperature: { type: "number", description: "Sampling temperature (0-2)", default: 1 },
        max_tokens: { type: "number", description: "Maximum tokens to generate" },
        top_p: { type: "number", description: "Nucleus sampling parameter" },
        frequency_penalty: { type: "number", description: "Frequency penalty (-2 to 2)" },
        presence_penalty: { type: "number", description: "Presence penalty (-2 to 2)" },
      },
      required: ["messages"],
    },
  },
  {
    name: "openai_chat_completion_stream",
    description: "Create a streaming chat completion",
    inputSchema: {
      type: "object",
      properties: {
        model: { type: "string", default: "gpt-4" },
        messages: { type: "array" },
        temperature: { type: "number", default: 1 },
        max_tokens: { type: "number" },
      },
      required: ["messages"],
    },
  },
  {
    name: "openai_chat_with_functions",
    description: "Chat completion with function calling",
    inputSchema: {
      type: "object",
      properties: {
        model: { type: "string", default: "gpt-4" },
        messages: { type: "array" },
        functions: {
          type: "array",
          description: "Available functions for the model to call",
        },
        function_call: {
          type: "string",
          description: "Controls function calling (auto, none, or specific function)",
        },
      },
      required: ["messages", "functions"],
    },
  },

  // ==================== EMBEDDINGS ====================
  {
    name: "openai_create_embedding",
    description: "Create embeddings for text using OpenAI embedding models",
    inputSchema: {
      type: "object",
      properties: {
        input: {
          type: "string",
          description: "Text to create embedding for",
        },
        model: {
          type: "string",
          description: "Embedding model (text-embedding-3-small, text-embedding-3-large, text-embedding-ada-002)",
          default: "text-embedding-3-small",
        },
        dimensions: {
          type: "number",
          description: "Number of dimensions for the embedding (only for text-embedding-3 models)",
        },
      },
      required: ["input"],
    },
  },
  {
    name: "openai_batch_embeddings",
    description: "Create embeddings for multiple texts in batch",
    inputSchema: {
      type: "object",
      properties: {
        inputs: {
          type: "array",
          items: { type: "string" },
          description: "Array of texts to create embeddings for",
        },
        model: { type: "string", default: "text-embedding-3-small" },
      },
      required: ["inputs"],
    },
  },

  // ==================== IMAGES (DALL-E) ====================
  {
    name: "openai_generate_image",
    description: "Generate images using DALL-E",
    inputSchema: {
      type: "object",
      properties: {
        prompt: { type: "string", description: "Text description of the image" },
        model: {
          type: "string",
          description: "Model to use (dall-e-2, dall-e-3)",
          default: "dall-e-3",
        },
        size: {
          type: "string",
          description: "Image size (1024x1024, 1792x1024, 1024x1792 for dall-e-3)",
          default: "1024x1024",
        },
        quality: {
          type: "string",
          description: "Quality (standard, hd) - dall-e-3 only",
          default: "standard",
        },
        n: { type: "number", description: "Number of images to generate", default: 1 },
      },
      required: ["prompt"],
    },
  },
  {
    name: "openai_edit_image",
    description: "Edit an image using DALL-E (requires image file)",
    inputSchema: {
      type: "object",
      properties: {
        image_path: { type: "string", description: "Path to image file (PNG)" },
        prompt: { type: "string", description: "Description of the edit" },
        mask_path: { type: "string", description: "Path to mask image (optional)" },
        size: { type: "string", default: "1024x1024" },
        n: { type: "number", default: 1 },
      },
      required: ["image_path", "prompt"],
    },
  },
  {
    name: "openai_create_image_variation",
    description: "Create variations of an existing image",
    inputSchema: {
      type: "object",
      properties: {
        image_path: { type: "string", description: "Path to image file (PNG)" },
        n: { type: "number", description: "Number of variations", default: 1 },
        size: { type: "string", default: "1024x1024" },
      },
      required: ["image_path"],
    },
  },

  // ==================== AUDIO ====================
  {
    name: "openai_text_to_speech",
    description: "Convert text to speech using OpenAI TTS",
    inputSchema: {
      type: "object",
      properties: {
        input: { type: "string", description: "Text to convert to speech" },
        model: {
          type: "string",
          description: "TTS model (tts-1, tts-1-hd)",
          default: "tts-1",
        },
        voice: {
          type: "string",
          description: "Voice to use (alloy, echo, fable, onyx, nova, shimmer)",
          default: "alloy",
        },
        speed: {
          type: "number",
          description: "Speed of speech (0.25 to 4.0)",
          default: 1.0,
        },
        response_format: {
          type: "string",
          description: "Audio format (mp3, opus, aac, flac)",
          default: "mp3",
        },
      },
      required: ["input"],
    },
  },
  {
    name: "openai_speech_to_text",
    description: "Transcribe audio to text using Whisper",
    inputSchema: {
      type: "object",
      properties: {
        file_path: { type: "string", description: "Path to audio file" },
        model: { type: "string", description: "Model to use", default: "whisper-1" },
        language: { type: "string", description: "Language code (e.g., en, es)" },
        prompt: { type: "string", description: "Optional prompt to guide transcription" },
        response_format: {
          type: "string",
          description: "Format (json, text, srt, vtt)",
          default: "json",
        },
        temperature: { type: "number", description: "Sampling temperature" },
      },
      required: ["file_path"],
    },
  },
  {
    name: "openai_translate_audio",
    description: "Translate audio to English using Whisper",
    inputSchema: {
      type: "object",
      properties: {
        file_path: { type: "string", description: "Path to audio file" },
        model: { type: "string", default: "whisper-1" },
        prompt: { type: "string", description: "Optional prompt" },
      },
      required: ["file_path"],
    },
  },

  // ==================== MODERATION ====================
  {
    name: "openai_moderate_content",
    description: "Check if content violates OpenAI usage policies",
    inputSchema: {
      type: "object",
      properties: {
        input: { type: "string", description: "Text to moderate" },
      },
      required: ["input"],
    },
  },

  // ==================== MODELS ====================
  {
    name: "openai_list_models",
    description: "List all available OpenAI models",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "openai_get_model",
    description: "Get details about a specific model",
    inputSchema: {
      type: "object",
      properties: {
        model: { type: "string", description: "Model ID (e.g., gpt-4)" },
      },
      required: ["model"],
    },
  },
  {
    name: "openai_delete_model",
    description: "Delete a fine-tuned model",
    inputSchema: {
      type: "object",
      properties: {
        model: { type: "string", description: "Fine-tuned model ID" },
      },
      required: ["model"],
    },
  },

  // ==================== FILES ====================
  {
    name: "openai_upload_file",
    description: "Upload a file for use with assistants, fine-tuning, or batch",
    inputSchema: {
      type: "object",
      properties: {
        file_path: { type: "string", description: "Path to file" },
        purpose: {
          type: "string",
          description: "Purpose: assistants, fine-tune, batch, vision",
          enum: ["assistants", "fine-tune", "batch", "vision"],
        },
      },
      required: ["file_path", "purpose"],
    },
  },
  {
    name: "openai_list_files",
    description: "List all uploaded files",
    inputSchema: {
      type: "object",
      properties: {
        purpose: { type: "string", description: "Filter by purpose" },
      },
    },
  },
  {
    name: "openai_retrieve_file",
    description: "Get file details",
    inputSchema: {
      type: "object",
      properties: {
        file_id: { type: "string", description: "File ID" },
      },
      required: ["file_id"],
    },
  },
  {
    name: "openai_delete_file",
    description: "Delete a file",
    inputSchema: {
      type: "object",
      properties: {
        file_id: { type: "string", description: "File ID" },
      },
      required: ["file_id"],
    },
  },
  {
    name: "openai_retrieve_file_content",
    description: "Download file content",
    inputSchema: {
      type: "object",
      properties: {
        file_id: { type: "string", description: "File ID" },
      },
      required: ["file_id"],
    },
  },

  // ==================== FINE-TUNING ====================
  {
    name: "openai_create_fine_tune",
    description: "Create a fine-tuning job",
    inputSchema: {
      type: "object",
      properties: {
        training_file: { type: "string", description: "Training file ID" },
        model: {
          type: "string",
          description: "Base model (gpt-3.5-turbo, gpt-4, etc.)",
          default: "gpt-3.5-turbo",
        },
        validation_file: { type: "string", description: "Validation file ID" },
        hyperparameters: {
          type: "object",
          description: "Training hyperparameters",
        },
        suffix: { type: "string", description: "Model name suffix" },
      },
      required: ["training_file", "model"],
    },
  },
  {
    name: "openai_list_fine_tunes",
    description: "List fine-tuning jobs",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Number of jobs to return" },
      },
    },
  },
  {
    name: "openai_retrieve_fine_tune",
    description: "Get fine-tuning job details",
    inputSchema: {
      type: "object",
      properties: {
        fine_tune_id: { type: "string", description: "Fine-tune job ID" },
      },
      required: ["fine_tune_id"],
    },
  },
  {
    name: "openai_cancel_fine_tune",
    description: "Cancel a fine-tuning job",
    inputSchema: {
      type: "object",
      properties: {
        fine_tune_id: { type: "string", description: "Fine-tune job ID" },
      },
      required: ["fine_tune_id"],
    },
  },
  {
    name: "openai_list_fine_tune_events",
    description: "List events for a fine-tuning job",
    inputSchema: {
      type: "object",
      properties: {
        fine_tune_id: { type: "string", description: "Fine-tune job ID" },
      },
      required: ["fine_tune_id"],
    },
  },
  {
    name: "openai_list_fine_tune_checkpoints",
    description: "List checkpoints for a fine-tuning job",
    inputSchema: {
      type: "object",
      properties: {
        fine_tune_id: { type: "string", description: "Fine-tune job ID" },
      },
      required: ["fine_tune_id"],
    },
  },

  // ==================== BATCH API ====================
  {
    name: "openai_create_batch",
    description: "Create a batch request (50% cost savings for async processing)",
    inputSchema: {
      type: "object",
      properties: {
        input_file_id: { type: "string", description: "Input file ID (JSONL)" },
        endpoint: {
          type: "string",
          description: "API endpoint (/v1/chat/completions, /v1/embeddings)",
        },
        completion_window: {
          type: "string",
          description: "Completion timeframe",
          default: "24h",
        },
        metadata: { type: "object", description: "Custom metadata" },
      },
      required: ["input_file_id", "endpoint"],
    },
  },
  {
    name: "openai_retrieve_batch",
    description: "Get batch details",
    inputSchema: {
      type: "object",
      properties: {
        batch_id: { type: "string", description: "Batch ID" },
      },
      required: ["batch_id"],
    },
  },
  {
    name: "openai_cancel_batch",
    description: "Cancel a batch",
    inputSchema: {
      type: "object",
      properties: {
        batch_id: { type: "string", description: "Batch ID" },
      },
      required: ["batch_id"],
    },
  },
  {
    name: "openai_list_batches",
    description: "List all batches",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Number to return" },
      },
    },
  },

  // ==================== ASSISTANTS ====================
  {
    name: "openai_create_assistant",
    description: "Create an AI assistant with tools and instructions",
    inputSchema: {
      type: "object",
      properties: {
        model: { type: "string", description: "Model to use", default: "gpt-4-turbo" },
        name: { type: "string", description: "Assistant name" },
        description: { type: "string", description: "Assistant description" },
        instructions: { type: "string", description: "System instructions" },
        tools: {
          type: "array",
          description: "Tools (code_interpreter, file_search, function)",
        },
        tool_resources: {
          type: "object",
          description: "Tool resources (vector stores, etc.)",
        },
        metadata: { type: "object", description: "Custom metadata" },
        temperature: { type: "number", description: "Sampling temperature" },
        top_p: { type: "number", description: "Nucleus sampling" },
      },
      required: ["model"],
    },
  },
  {
    name: "openai_list_assistants",
    description: "List all assistants",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Number to return", default: 20 },
        order: { type: "string", description: "Sort order (asc, desc)" },
      },
    },
  },
  {
    name: "openai_retrieve_assistant",
    description: "Get assistant details",
    inputSchema: {
      type: "object",
      properties: {
        assistant_id: { type: "string", description: "Assistant ID" },
      },
      required: ["assistant_id"],
    },
  },
  {
    name: "openai_modify_assistant",
    description: "Update an assistant",
    inputSchema: {
      type: "object",
      properties: {
        assistant_id: { type: "string", description: "Assistant ID" },
        model: { type: "string", description: "Model to use" },
        name: { type: "string", description: "Assistant name" },
        description: { type: "string", description: "Description" },
        instructions: { type: "string", description: "Instructions" },
        tools: { type: "array", description: "Tools" },
        tool_resources: { type: "object", description: "Tool resources" },
        metadata: { type: "object", description: "Metadata" },
      },
      required: ["assistant_id"],
    },
  },
  {
    name: "openai_delete_assistant",
    description: "Delete an assistant",
    inputSchema: {
      type: "object",
      properties: {
        assistant_id: { type: "string", description: "Assistant ID" },
      },
      required: ["assistant_id"],
    },
  },

  // ==================== THREADS ====================
  {
    name: "openai_create_thread",
    description: "Create a conversation thread",
    inputSchema: {
      type: "object",
      properties: {
        messages: {
          type: "array",
          description: "Initial messages (optional)",
        },
        tool_resources: {
          type: "object",
          description: "Tool resources for this thread",
        },
        metadata: { type: "object", description: "Custom metadata" },
      },
    },
  },
  {
    name: "openai_retrieve_thread",
    description: "Get thread details",
    inputSchema: {
      type: "object",
      properties: {
        thread_id: { type: "string", description: "Thread ID" },
      },
      required: ["thread_id"],
    },
  },
  {
    name: "openai_modify_thread",
    description: "Update a thread",
    inputSchema: {
      type: "object",
      properties: {
        thread_id: { type: "string", description: "Thread ID" },
        tool_resources: { type: "object", description: "Tool resources" },
        metadata: { type: "object", description: "Metadata" },
      },
      required: ["thread_id"],
    },
  },
  {
    name: "openai_delete_thread",
    description: "Delete a thread",
    inputSchema: {
      type: "object",
      properties: {
        thread_id: { type: "string", description: "Thread ID" },
      },
      required: ["thread_id"],
    },
  },

  // ==================== MESSAGES ====================
  {
    name: "openai_create_message",
    description: "Add a message to a thread",
    inputSchema: {
      type: "object",
      properties: {
        thread_id: { type: "string", description: "Thread ID" },
        role: {
          type: "string",
          description: "Message role",
          enum: ["user", "assistant"],
          default: "user",
        },
        content: { type: "string", description: "Message content" },
        attachments: {
          type: "array",
          description: "File attachments",
        },
        metadata: { type: "object", description: "Custom metadata" },
      },
      required: ["thread_id", "content"],
    },
  },
  {
    name: "openai_list_messages",
    description: "List messages in a thread",
    inputSchema: {
      type: "object",
      properties: {
        thread_id: { type: "string", description: "Thread ID" },
        limit: { type: "number", description: "Number to return", default: 20 },
        order: { type: "string", description: "Sort order (asc, desc)" },
      },
      required: ["thread_id"],
    },
  },
  {
    name: "openai_retrieve_message",
    description: "Get message details",
    inputSchema: {
      type: "object",
      properties: {
        thread_id: { type: "string", description: "Thread ID" },
        message_id: { type: "string", description: "Message ID" },
      },
      required: ["thread_id", "message_id"],
    },
  },
  {
    name: "openai_modify_message",
    description: "Update a message",
    inputSchema: {
      type: "object",
      properties: {
        thread_id: { type: "string", description: "Thread ID" },
        message_id: { type: "string", description: "Message ID" },
        metadata: { type: "object", description: "Metadata" },
      },
      required: ["thread_id", "message_id"],
    },
  },
  {
    name: "openai_delete_message",
    description: "Delete a message",
    inputSchema: {
      type: "object",
      properties: {
        thread_id: { type: "string", description: "Thread ID" },
        message_id: { type: "string", description: "Message ID" },
      },
      required: ["thread_id", "message_id"],
    },
  },

  // ==================== RUNS ====================
  {
    name: "openai_create_run",
    description: "Execute an assistant on a thread",
    inputSchema: {
      type: "object",
      properties: {
        thread_id: { type: "string", description: "Thread ID" },
        assistant_id: { type: "string", description: "Assistant ID" },
        model: { type: "string", description: "Override model" },
        instructions: { type: "string", description: "Override instructions" },
        additional_instructions: { type: "string", description: "Additional instructions" },
        tools: { type: "array", description: "Override tools" },
        metadata: { type: "object", description: "Custom metadata" },
        temperature: { type: "number", description: "Sampling temperature" },
        top_p: { type: "number", description: "Nucleus sampling" },
        stream: { type: "boolean", description: "Stream response", default: false },
      },
      required: ["thread_id", "assistant_id"],
    },
  },
  {
    name: "openai_create_thread_and_run",
    description: "Create thread and run in one request",
    inputSchema: {
      type: "object",
      properties: {
        assistant_id: { type: "string", description: "Assistant ID" },
        thread: { type: "object", description: "Thread creation params" },
        model: { type: "string", description: "Override model" },
        instructions: { type: "string", description: "Override instructions" },
        tools: { type: "array", description: "Override tools" },
        stream: { type: "boolean", description: "Stream response" },
      },
      required: ["assistant_id"],
    },
  },
  {
    name: "openai_list_runs",
    description: "List runs in a thread",
    inputSchema: {
      type: "object",
      properties: {
        thread_id: { type: "string", description: "Thread ID" },
        limit: { type: "number", description: "Number to return", default: 20 },
        order: { type: "string", description: "Sort order (asc, desc)" },
      },
      required: ["thread_id"],
    },
  },
  {
    name: "openai_retrieve_run",
    description: "Get run details",
    inputSchema: {
      type: "object",
      properties: {
        thread_id: { type: "string", description: "Thread ID" },
        run_id: { type: "string", description: "Run ID" },
      },
      required: ["thread_id", "run_id"],
    },
  },
  {
    name: "openai_modify_run",
    description: "Update a run",
    inputSchema: {
      type: "object",
      properties: {
        thread_id: { type: "string", description: "Thread ID" },
        run_id: { type: "string", description: "Run ID" },
        metadata: { type: "object", description: "Metadata" },
      },
      required: ["thread_id", "run_id"],
    },
  },
  {
    name: "openai_cancel_run",
    description: "Cancel a run",
    inputSchema: {
      type: "object",
      properties: {
        thread_id: { type: "string", description: "Thread ID" },
        run_id: { type: "string", description: "Run ID" },
      },
      required: ["thread_id", "run_id"],
    },
  },
  {
    name: "openai_submit_tool_outputs",
    description: "Submit tool outputs to continue a run",
    inputSchema: {
      type: "object",
      properties: {
        thread_id: { type: "string", description: "Thread ID" },
        run_id: { type: "string", description: "Run ID" },
        tool_outputs: {
          type: "array",
          description: "Tool outputs to submit",
        },
      },
      required: ["thread_id", "run_id", "tool_outputs"],
    },
  },
  {
    name: "openai_list_run_steps",
    description: "List steps in a run (detailed execution)",
    inputSchema: {
      type: "object",
      properties: {
        thread_id: { type: "string", description: "Thread ID" },
        run_id: { type: "string", description: "Run ID" },
        limit: { type: "number", description: "Number to return" },
      },
      required: ["thread_id", "run_id"],
    },
  },
  {
    name: "openai_retrieve_run_step",
    description: "Get run step details",
    inputSchema: {
      type: "object",
      properties: {
        thread_id: { type: "string", description: "Thread ID" },
        run_id: { type: "string", description: "Run ID" },
        step_id: { type: "string", description: "Step ID" },
      },
      required: ["thread_id", "run_id", "step_id"],
    },
  },

  // ==================== VECTOR STORES (RAG) ====================
  {
    name: "openai_create_vector_store",
    description: "Create a vector store for RAG (Retrieval Augmented Generation)",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Vector store name" },
        file_ids: {
          type: "array",
          description: "File IDs to add to vector store",
        },
        expires_after: {
          type: "object",
          description: "Expiration policy",
        },
        metadata: { type: "object", description: "Custom metadata" },
      },
      required: ["name"],
    },
  },
  {
    name: "openai_list_vector_stores",
    description: "List all vector stores",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Number to return", default: 20 },
        order: { type: "string", description: "Sort order (asc, desc)" },
      },
    },
  },
  {
    name: "openai_retrieve_vector_store",
    description: "Get vector store details",
    inputSchema: {
      type: "object",
      properties: {
        vector_store_id: { type: "string", description: "Vector store ID" },
      },
      required: ["vector_store_id"],
    },
  },
  {
    name: "openai_modify_vector_store",
    description: "Update a vector store",
    inputSchema: {
      type: "object",
      properties: {
        vector_store_id: { type: "string", description: "Vector store ID" },
        name: { type: "string", description: "New name" },
        expires_after: { type: "object", description: "Expiration policy" },
        metadata: { type: "object", description: "Metadata" },
      },
      required: ["vector_store_id"],
    },
  },
  {
    name: "openai_delete_vector_store",
    description: "Delete a vector store",
    inputSchema: {
      type: "object",
      properties: {
        vector_store_id: { type: "string", description: "Vector store ID" },
      },
      required: ["vector_store_id"],
    },
  },
  {
    name: "openai_create_vector_store_file",
    description: "Add a file to a vector store",
    inputSchema: {
      type: "object",
      properties: {
        vector_store_id: { type: "string", description: "Vector store ID" },
        file_id: { type: "string", description: "File ID to add" },
      },
      required: ["vector_store_id", "file_id"],
    },
  },
  {
    name: "openai_list_vector_store_files",
    description: "List files in a vector store",
    inputSchema: {
      type: "object",
      properties: {
        vector_store_id: { type: "string", description: "Vector store ID" },
        limit: { type: "number", description: "Number to return" },
      },
      required: ["vector_store_id"],
    },
  },
  {
    name: "openai_retrieve_vector_store_file",
    description: "Get vector store file details",
    inputSchema: {
      type: "object",
      properties: {
        vector_store_id: { type: "string", description: "Vector store ID" },
        file_id: { type: "string", description: "File ID" },
      },
      required: ["vector_store_id", "file_id"],
    },
  },
  {
    name: "openai_delete_vector_store_file",
    description: "Remove a file from vector store",
    inputSchema: {
      type: "object",
      properties: {
        vector_store_id: { type: "string", description: "Vector store ID" },
        file_id: { type: "string", description: "File ID" },
      },
      required: ["vector_store_id", "file_id"],
    },
  },
  {
    name: "openai_create_vector_store_file_batch",
    description: "Add multiple files to vector store at once",
    inputSchema: {
      type: "object",
      properties: {
        vector_store_id: { type: "string", description: "Vector store ID" },
        file_ids: {
          type: "array",
          description: "Array of file IDs to add",
        },
      },
      required: ["vector_store_id", "file_ids"],
    },
  },
  {
    name: "openai_retrieve_vector_store_file_batch",
    description: "Get batch upload status",
    inputSchema: {
      type: "object",
      properties: {
        vector_store_id: { type: "string", description: "Vector store ID" },
        batch_id: { type: "string", description: "Batch ID" },
      },
      required: ["vector_store_id", "batch_id"],
    },
  },
  {
    name: "openai_cancel_vector_store_file_batch",
    description: "Cancel a batch upload",
    inputSchema: {
      type: "object",
      properties: {
        vector_store_id: { type: "string", description: "Vector store ID" },
        batch_id: { type: "string", description: "Batch ID" },
      },
      required: ["vector_store_id", "batch_id"],
    },
  },

  // ==================== COST MANAGEMENT ====================
  {
    name: "openai_estimate_cost",
    description: "Estimate cost of an operation before executing it",
    inputSchema: {
      type: "object",
      properties: {
        operation: {
          type: "string",
          description: "Operation type (chat, embedding, image, etc.)",
        },
        model: { type: "string", description: "Model to use" },
        input_text: { type: "string", description: "Input text for token estimation" },
        max_tokens: { type: "number", description: "Max output tokens" },
        image_count: { type: "number", description: "Number of images (for image generation)" },
        image_size: { type: "string", description: "Image size" },
        image_quality: { type: "string", description: "Image quality (standard/hd)" },
      },
      required: ["operation", "model"],
    },
  },
  {
    name: "openai_get_budget_status",
    description: "Get current budget usage and remaining balance",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "openai_get_cost_breakdown",
    description: "Get detailed cost breakdown by model, operation, and time period",
    inputSchema: {
      type: "object",
      properties: {
        group_by: {
          type: "string",
          description: "Group by: model, operation, day, hour",
          enum: ["model", "operation", "day", "hour"],
        },
        start_date: { type: "string", description: "Start date (YYYY-MM-DD)" },
        end_date: { type: "string", description: "End date (YYYY-MM-DD)" },
      },
    },
  },
  {
    name: "openai_compare_models",
    description: "Compare cost and performance between different models for the same task",
    inputSchema: {
      type: "object",
      properties: {
        models: {
          type: "array",
          description: "Models to compare (e.g., ['gpt-4', 'gpt-3.5-turbo'])",
        },
        input_text: { type: "string", description: "Sample input text" },
        max_tokens: { type: "number", description: "Max output tokens" },
      },
      required: ["models", "input_text"],
    },
  },
  {
    name: "openai_optimize_prompt",
    description: "Analyze prompt and suggest optimizations to reduce token usage",
    inputSchema: {
      type: "object",
      properties: {
        prompt: { type: "string", description: "Prompt to optimize" },
        model: { type: "string", description: "Target model" },
      },
      required: ["prompt"],
    },
  },
  {
    name: "openai_export_cost_report",
    description: "Export cost report in CSV or JSON format",
    inputSchema: {
      type: "object",
      properties: {
        format: {
          type: "string",
          description: "Export format",
          enum: ["csv", "json"],
        },
        start_date: { type: "string", description: "Start date (YYYY-MM-DD)" },
        end_date: { type: "string", description: "End date (YYYY-MM-DD)" },
      },
      required: ["format"],
    },
  },
  {
    name: "openai_get_token_analytics",
    description: "Get detailed token usage analytics and patterns",
    inputSchema: {
      type: "object",
      properties: {
        period: {
          type: "string",
          description: "Time period",
          enum: ["today", "week", "month", "all"],
        },
      },
    },
  },
  {
    name: "openai_suggest_cheaper_alternative",
    description: "Suggest cheaper model alternatives for a given task",
    inputSchema: {
      type: "object",
      properties: {
        current_model: { type: "string", description: "Current model being used" },
        task_type: {
          type: "string",
          description: "Type of task",
          enum: ["chat", "completion", "embedding", "image"],
        },
        quality_requirement: {
          type: "string",
          description: "Quality requirement",
          enum: ["highest", "high", "medium", "low"],
        },
      },
      required: ["current_model", "task_type"],
    },
  },

  // ==================== USAGE & BILLING API (NEW Dec 2024) ====================
  {
    name: "openai_get_usage",
    description: "Get actual API usage data from OpenAI (requires admin key)",
    inputSchema: {
      type: "object",
      properties: {
        start_time: { type: "number", description: "Unix timestamp start time" },
        end_time: { type: "number", description: "Unix timestamp end time" },
        bucket_width: {
          type: "string",
          description: "Time bucket width",
          enum: ["1m", "1h", "1d"],
        },
        project_ids: { type: "array", description: "Filter by project IDs" },
        user_ids: { type: "array", description: "Filter by user IDs" },
        api_key_ids: { type: "array", description: "Filter by API key IDs" },
        models: { type: "array", description: "Filter by models" },
        group_by: { type: "array", description: "Group by fields" },
        limit: { type: "number", description: "Max results" },
      },
    },
  },
  {
    name: "openai_get_costs",
    description: "Get daily cost breakdown from OpenAI (requires admin key)",
    inputSchema: {
      type: "object",
      properties: {
        start_time: { type: "number", description: "Unix timestamp start time" },
        end_time: { type: "number", description: "Unix timestamp end time" },
        bucket_width: {
          type: "string",
          description: "Time bucket width (1d only)",
          enum: ["1d"],
        },
        project_ids: { type: "array", description: "Filter by project IDs" },
        group_by: { type: "array", description: "Group by fields" },
        limit: { type: "number", description: "Max results" },
      },
    },
  },
  {
    name: "openai_get_usage_completions",
    description: "Get completion usage details",
    inputSchema: {
      type: "object",
      properties: {
        start_time: { type: "number", description: "Unix timestamp" },
        end_time: { type: "number", description: "Unix timestamp" },
        bucket_width: { type: "string", enum: ["1m", "1h", "1d"] },
      },
    },
  },
  {
    name: "openai_get_usage_embeddings",
    description: "Get embeddings usage details",
    inputSchema: {
      type: "object",
      properties: {
        start_time: { type: "number" },
        end_time: { type: "number" },
        bucket_width: { type: "string", enum: ["1m", "1h", "1d"] },
      },
    },
  },
  {
    name: "openai_get_usage_moderations",
    description: "Get moderation usage details",
    inputSchema: {
      type: "object",
      properties: {
        start_time: { type: "number" },
        end_time: { type: "number" },
        bucket_width: { type: "string", enum: ["1m", "1h", "1d"] },
      },
    },
  },
  {
    name: "openai_get_usage_images",
    description: "Get image generation usage details",
    inputSchema: {
      type: "object",
      properties: {
        start_time: { type: "number" },
        end_time: { type: "number" },
        bucket_width: { type: "string", enum: ["1m", "1h", "1d"] },
      },
    },
  },
  {
    name: "openai_get_usage_audio_speeches",
    description: "Get TTS usage details",
    inputSchema: {
      type: "object",
      properties: {
        start_time: { type: "number" },
        end_time: { type: "number" },
        bucket_width: { type: "string", enum: ["1m", "1h", "1d"] },
      },
    },
  },
  {
    name: "openai_get_usage_audio_transcriptions",
    description: "Get Whisper transcription usage details",
    inputSchema: {
      type: "object",
      properties: {
        start_time: { type: "number" },
        end_time: { type: "number" },
        bucket_width: { type: "string", enum: ["1m", "1h", "1d"] },
      },
    },
  },

  // ==================== PROJECTS & ORGANIZATION MANAGEMENT ====================
  {
    name: "openai_list_projects",
    description: "List all projects in organization (requires admin key)",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number" },
        after: { type: "string", description: "Cursor for pagination" },
      },
    },
  },
  {
    name: "openai_get_project",
    description: "Get project details",
    inputSchema: {
      type: "object",
      properties: {
        project_id: { type: "string" },
      },
      required: ["project_id"],
    },
  },
  {
    name: "openai_create_project",
    description: "Create a new project",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
      },
      required: ["name"],
    },
  },
  {
    name: "openai_update_project",
    description: "Update project settings",
    inputSchema: {
      type: "object",
      properties: {
        project_id: { type: "string" },
        name: { type: "string" },
      },
      required: ["project_id"],
    },
  },
  {
    name: "openai_archive_project",
    description: "Archive a project",
    inputSchema: {
      type: "object",
      properties: {
        project_id: { type: "string" },
      },
      required: ["project_id"],
    },
  },

  // ==================== USER & INVITE MANAGEMENT ====================
  {
    name: "openai_list_users",
    description: "List users in organization",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number" },
        after: { type: "string" },
      },
    },
  },
  {
    name: "openai_get_user",
    description: "Get user details",
    inputSchema: {
      type: "object",
      properties: {
        user_id: { type: "string" },
      },
      required: ["user_id"],
    },
  },
  {
    name: "openai_update_user",
    description: "Update user role",
    inputSchema: {
      type: "object",
      properties: {
        user_id: { type: "string" },
        role: { type: "string", enum: ["owner", "reader"] },
      },
      required: ["user_id", "role"],
    },
  },
  {
    name: "openai_delete_user",
    description: "Remove user from organization",
    inputSchema: {
      type: "object",
      properties: {
        user_id: { type: "string" },
      },
      required: ["user_id"],
    },
  },
  {
    name: "openai_list_invites",
    description: "List pending invites",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number" },
        after: { type: "string" },
      },
    },
  },
  {
    name: "openai_create_invite",
    description: "Invite user to organization",
    inputSchema: {
      type: "object",
      properties: {
        email: { type: "string" },
        role: { type: "string", enum: ["owner", "reader"] },
      },
      required: ["email", "role"],
    },
  },
  {
    name: "openai_delete_invite",
    description: "Cancel pending invite",
    inputSchema: {
      type: "object",
      properties: {
        invite_id: { type: "string" },
      },
      required: ["invite_id"],
    },
  },

  // ==================== RATE LIMITS & QUOTAS ====================
  {
    name: "openai_get_rate_limits",
    description: "Get current rate limits for your account",
    inputSchema: {
      type: "object",
      properties: {
        model: { type: "string", description: "Check limits for specific model" },
      },
    },
  },

  // ==================== ADVANCED COST FEATURES ====================
  {
    name: "openai_track_user_cost",
    description: "Track costs for a specific user/tenant",
    inputSchema: {
      type: "object",
      properties: {
        user_id: { type: "string", description: "User/tenant identifier" },
        operation: { type: "string" },
        cost: { type: "number" },
        metadata: { type: "object" },
      },
      required: ["user_id", "operation", "cost"],
    },
  },
  {
    name: "openai_get_user_costs",
    description: "Get cost breakdown for a specific user/tenant",
    inputSchema: {
      type: "object",
      properties: {
        user_id: { type: "string" },
        start_date: { type: "string" },
        end_date: { type: "string" },
      },
      required: ["user_id"],
    },
  },
  {
    name: "openai_set_cost_alert",
    description: "Set up cost alert with webhook notification",
    inputSchema: {
      type: "object",
      properties: {
        alert_name: { type: "string" },
        threshold: { type: "number", description: "Cost threshold in USD" },
        period: { type: "string", enum: ["daily", "weekly", "monthly"] },
        webhook_url: { type: "string", description: "Webhook URL for notifications" },
        email: { type: "string", description: "Email for notifications" },
      },
      required: ["alert_name", "threshold", "period"],
    },
  },
  {
    name: "openai_list_cost_alerts",
    description: "List all configured cost alerts",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "openai_delete_cost_alert",
    description: "Delete a cost alert",
    inputSchema: {
      type: "object",
      properties: {
        alert_id: { type: "string" },
      },
      required: ["alert_id"],
    },
  },
  {
    name: "openai_forecast_costs",
    description: "Forecast future costs based on usage patterns",
    inputSchema: {
      type: "object",
      properties: {
        days_ahead: { type: "number", description: "Days to forecast (default: 30)" },
        confidence_level: { type: "number", description: "Confidence level 0-1 (default: 0.95)" },
      },
    },
  },
  {
    name: "openai_detect_cost_anomalies",
    description: "Detect unusual spending patterns",
    inputSchema: {
      type: "object",
      properties: {
        sensitivity: {
          type: "string",
          enum: ["low", "medium", "high"],
          description: "Anomaly detection sensitivity",
        },
        lookback_days: { type: "number", description: "Days to analyze (default: 30)" },
      },
    },
  },
  {
    name: "openai_get_budget_recommendations",
    description: "Get AI-powered budget recommendations based on usage",
    inputSchema: {
      type: "object",
      properties: {
        current_budget: { type: "number", description: "Current monthly budget" },
      },
    },
  },

  // REALTIME API (6 tools)
  {
    name: "openai_create_realtime_session",
    description: "Create a realtime voice/audio session",
    inputSchema: {
      type: "object",
      properties: {
        model: { type: "string", description: "Model (gpt-4o-realtime-preview)" },
        voice: { type: "string", enum: ["alloy", "echo", "fable", "onyx", "nova", "shimmer"] },
        modalities: { type: "array", items: { type: "string", enum: ["text", "audio"] } },
        instructions: { type: "string", description: "System instructions" },
      },
      required: ["model"],
    },
  },
  {
    name: "openai_send_realtime_message",
    description: "Send message in realtime session",
    inputSchema: {
      type: "object",
      properties: {
        session_id: { type: "string" },
        type: { type: "string", enum: ["text", "audio"] },
        content: { type: "string", description: "Text or base64 audio" },
      },
      required: ["session_id", "type", "content"],
    },
  },
  {
    name: "openai_get_realtime_response",
    description: "Get response from realtime session",
    inputSchema: {
      type: "object",
      properties: {
        session_id: { type: "string" },
        timeout: { type: "number", description: "Timeout in seconds" },
      },
      required: ["session_id"],
    },
  },
  {
    name: "openai_update_realtime_session",
    description: "Update realtime session settings",
    inputSchema: {
      type: "object",
      properties: {
        session_id: { type: "string" },
        voice: { type: "string" },
        instructions: { type: "string" },
        temperature: { type: "number" },
      },
      required: ["session_id"],
    },
  },
  {
    name: "openai_interrupt_realtime_response",
    description: "Interrupt ongoing realtime response",
    inputSchema: {
      type: "object",
      properties: {
        session_id: { type: "string" },
      },
      required: ["session_id"],
    },
  },
  {
    name: "openai_close_realtime_session",
    description: "Close realtime session",
    inputSchema: {
      type: "object",
      properties: {
        session_id: { type: "string" },
      },
      required: ["session_id"],
    },
  },

  // MODEL CAPABILITIES (3 tools)
  {
    name: "openai_get_model_capabilities",
    description: "Get detailed model capabilities and limits",
    inputSchema: {
      type: "object",
      properties: {
        model: { type: "string", description: "Model ID" },
      },
      required: ["model"],
    },
  },
  {
    name: "openai_compare_model_capabilities",
    description: "Compare capabilities between multiple models",
    inputSchema: {
      type: "object",
      properties: {
        models: { type: "array", items: { type: "string" } },
      },
      required: ["models"],
    },
  },
  {
    name: "openai_get_model_pricing",
    description: "Get current pricing for a model",
    inputSchema: {
      type: "object",
      properties: {
        model: { type: "string" },
      },
      required: ["model"],
    },
  },

  // ADVANCED BATCH OPERATIONS (3 tools)
  {
    name: "openai_get_batch_results",
    description: "Get results from completed batch",
    inputSchema: {
      type: "object",
      properties: {
        batch_id: { type: "string" },
        output_file_id: { type: "string", description: "Optional: specific output file" },
      },
      required: ["batch_id"],
    },
  },
  {
    name: "openai_estimate_batch_cost",
    description: "Estimate cost of batch before submission",
    inputSchema: {
      type: "object",
      properties: {
        input_file_id: { type: "string" },
        endpoint: { type: "string", description: "/v1/chat/completions or /v1/embeddings" },
      },
      required: ["input_file_id", "endpoint"],
    },
  },
  {
    name: "openai_get_batch_progress",
    description: "Get detailed progress of running batch",
    inputSchema: {
      type: "object",
      properties: {
        batch_id: { type: "string" },
      },
      required: ["batch_id"],
    },
  },

  // ORGANIZATION SETTINGS (3 tools)
  {
    name: "openai_get_organization_settings",
    description: "Get organization settings and limits",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "openai_update_organization_settings",
    description: "Update organization settings",
    inputSchema: {
      type: "object",
      properties: {
        settings: { type: "object", description: "Settings to update" },
      },
      required: ["settings"],
    },
  },
  {
    name: "openai_get_organization_usage_limits",
    description: "Get usage limits and quotas",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },

  // ADVANCED USAGE ANALYTICS (3 tools)
  {
    name: "openai_get_usage_by_model",
    description: "Get usage breakdown by model",
    inputSchema: {
      type: "object",
      properties: {
        start_date: { type: "string", description: "YYYY-MM-DD" },
        end_date: { type: "string", description: "YYYY-MM-DD" },
      },
      required: ["start_date", "end_date"],
    },
  },
  {
    name: "openai_get_usage_by_user",
    description: "Get usage breakdown by user/API key",
    inputSchema: {
      type: "object",
      properties: {
        start_date: { type: "string" },
        end_date: { type: "string" },
      },
      required: ["start_date", "end_date"],
    },
  },
  {
    name: "openai_export_usage_data",
    description: "Export detailed usage data",
    inputSchema: {
      type: "object",
      properties: {
        start_date: { type: "string" },
        end_date: { type: "string" },
        format: { type: "string", enum: ["json", "csv"] },
      },
      required: ["start_date", "end_date"],
    },
  },

  // ==================== TOKEN MANAGEMENT & OPTIMIZATION ====================
  {
    name: "openai_count_tokens",
    description: "Count tokens in text using tiktoken (accurate token counting for any OpenAI model)",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string", description: "Text to count tokens for" },
        model: { type: "string", description: "Model to use for encoding (gpt-4, gpt-3.5-turbo, etc.)", default: "gpt-4" },
      },
      required: ["text"],
    },
  },
  {
    name: "openai_count_tokens_batch",
    description: "Count tokens for multiple texts in batch",
    inputSchema: {
      type: "object",
      properties: {
        texts: { type: "array", items: { type: "string" }, description: "Array of texts to count tokens for" },
        model: { type: "string", default: "gpt-4" },
      },
      required: ["texts"],
    },
  },
  {
    name: "openai_count_message_tokens",
    description: "Count tokens for chat messages (includes message formatting overhead)",
    inputSchema: {
      type: "object",
      properties: {
        messages: { type: "array", description: "Array of chat messages" },
        model: { type: "string", default: "gpt-4" },
      },
      required: ["messages"],
    },
  },
  {
    name: "openai_optimize_prompt_tokens",
    description: "Analyze prompt and suggest token optimizations without losing meaning",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string", description: "Prompt text to optimize" },
        target_reduction: { type: "number", description: "Target token reduction percentage (0-50)", default: 20 },
        model: { type: "string", default: "gpt-4" },
      },
      required: ["text"],
    },
  },
  {
    name: "openai_estimate_cost_from_tokens",
    description: "Estimate cost from token counts for any model",
    inputSchema: {
      type: "object",
      properties: {
        input_tokens: { type: "number", description: "Number of input tokens" },
        output_tokens: { type: "number", description: "Number of output tokens" },
        model: { type: "string", description: "Model name", default: "gpt-4" },
      },
      required: ["input_tokens", "output_tokens"],
    },
  },
  {
    name: "openai_compare_model_costs",
    description: "Compare costs across different models for the same input",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string", description: "Input text to compare" },
        models: { type: "array", items: { type: "string" }, description: "Models to compare", default: ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"] },
        expected_output_tokens: { type: "number", description: "Expected output length", default: 500 },
      },
      required: ["text"],
    },
  },
  {
    name: "openai_find_cheapest_model",
    description: "Find the cheapest model that meets quality requirements",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string", description: "Input text" },
        min_quality_tier: { type: "string", enum: ["basic", "standard", "premium"], description: "Minimum quality tier", default: "standard" },
        expected_output_tokens: { type: "number", default: 500 },
      },
      required: ["text"],
    },
  },
  {
    name: "openai_token_budget_check",
    description: "Check if operation fits within token budget",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string", description: "Input text" },
        max_tokens: { type: "number", description: "Maximum allowed tokens" },
        model: { type: "string", default: "gpt-4" },
      },
      required: ["text", "max_tokens"],
    },
  },

  // ==================== MODEL COMPARISON & SELECTION ====================
  {
    name: "openai_compare_models_detailed",
    description: "Compare capabilities, costs, and performance of different models with custom criteria",
    inputSchema: {
      type: "object",
      properties: {
        models: { type: "array", items: { type: "string" }, description: "Models to compare", default: ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"] },
        criteria: { type: "array", items: { type: "string" }, description: "Comparison criteria", default: ["cost", "speed", "quality", "context_window"] },
      },
      required: [],
    },
  },
  {
    name: "openai_recommend_model",
    description: "AI-powered model recommendation based on use case",
    inputSchema: {
      type: "object",
      properties: {
        use_case: { type: "string", description: "Description of use case" },
        constraints: { type: "object", description: "Constraints (max_cost, min_quality, max_latency)" },
        sample_input: { type: "string", description: "Sample input text" },
      },
      required: ["use_case"],
    },
  },
  {
    name: "openai_model_benchmark",
    description: "Benchmark models on test cases with quality scoring",
    inputSchema: {
      type: "object",
      properties: {
        models: { type: "array", items: { type: "string" }, description: "Models to benchmark" },
        test_cases: { type: "array", description: "Array of test prompts" },
        evaluation_criteria: { type: "array", items: { type: "string" }, description: "Criteria to evaluate", default: ["accuracy", "coherence", "instruction_following"] },
      },
      required: ["models", "test_cases"],
    },
  },
  {
    name: "openai_model_quality_score",
    description: "Score model output quality on multiple dimensions",
    inputSchema: {
      type: "object",
      properties: {
        model: { type: "string", description: "Model to score" },
        prompt: { type: "string", description: "Test prompt" },
        expected_output: { type: "string", description: "Expected output (optional)" },
        criteria: { type: "array", items: { type: "string" }, default: ["accuracy", "coherence", "relevance", "completeness"] },
      },
      required: ["model", "prompt"],
    },
  },
  {
    name: "openai_model_latency_test",
    description: "Test model latency with multiple requests",
    inputSchema: {
      type: "object",
      properties: {
        model: { type: "string", description: "Model to test" },
        prompt: { type: "string", description: "Test prompt" },
        iterations: { type: "number", description: "Number of test iterations", default: 5 },
      },
      required: ["model", "prompt"],
    },
  },
  {
    name: "openai_model_cost_quality_tradeoff",
    description: "Analyze cost vs quality tradeoffs across models",
    inputSchema: {
      type: "object",
      properties: {
        models: { type: "array", items: { type: "string" }, description: "Models to analyze" },
        test_prompt: { type: "string", description: "Test prompt" },
        budget: { type: "number", description: "Budget constraint (USD)" },
      },
      required: ["models", "test_prompt"],
    },
  },
  {
    name: "openai_model_fallback_chain",
    description: "Configure fallback model chain for reliability",
    inputSchema: {
      type: "object",
      properties: {
        primary_model: { type: "string", description: "Primary model" },
        fallback_models: { type: "array", items: { type: "string" }, description: "Fallback models in order" },
        fallback_conditions: { type: "array", items: { type: "string" }, description: "Conditions to trigger fallback", default: ["error", "timeout", "rate_limit"] },
      },
      required: ["primary_model", "fallback_models"],
    },
  },
  {
    name: "openai_model_ab_test",
    description: "A/B test two models with statistical significance",
    inputSchema: {
      type: "object",
      properties: {
        model_a: { type: "string", description: "First model" },
        model_b: { type: "string", description: "Second model" },
        test_cases: { type: "array", description: "Array of test prompts" },
        evaluation_method: { type: "string", enum: ["human", "ai", "automated"], default: "ai" },
      },
      required: ["model_a", "model_b", "test_cases"],
    },
  },

  // ==================== SAFETY & COMPLIANCE ====================
  {
    name: "openai_content_safety_check",
    description: "Check content for safety issues using OpenAI Moderation API",
    inputSchema: {
      type: "object",
      properties: {
        content: { type: "string", description: "Content to check" },
        categories: { type: "array", items: { type: "string" }, description: "Specific categories to check" },
      },
      required: ["content"],
    },
  },
  {
    name: "openai_pii_detection",
    description: "Detect personally identifiable information (PII) in text",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string", description: "Text to scan for PII" },
        pii_types: { type: "array", items: { type: "string" }, description: "Types of PII to detect", default: ["email", "phone", "ssn", "credit_card", "address"] },
      },
      required: ["text"],
    },
  },
  {
    name: "openai_pii_redaction",
    description: "Automatically redact PII from text",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string", description: "Text to redact" },
        redaction_method: { type: "string", enum: ["mask", "remove", "hash"], default: "mask" },
        pii_types: { type: "array", items: { type: "string" }, default: ["email", "phone", "ssn", "credit_card"] },
      },
      required: ["text"],
    },
  },
  {
    name: "openai_toxicity_score",
    description: "Score text toxicity on multiple dimensions",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string", description: "Text to score" },
        dimensions: { type: "array", items: { type: "string" }, default: ["hate", "harassment", "violence", "sexual", "self-harm"] },
      },
      required: ["text"],
    },
  },
  {
    name: "openai_bias_detection",
    description: "Detect potential bias in text",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string", description: "Text to analyze" },
        bias_types: { type: "array", items: { type: "string" }, default: ["gender", "race", "age", "religion", "political"] },
      },
      required: ["text"],
    },
  },
  {
    name: "openai_compliance_check",
    description: "Check content for GDPR/HIPAA/SOC2 compliance",
    inputSchema: {
      type: "object",
      properties: {
        content: { type: "string", description: "Content to check" },
        compliance_standards: { type: "array", items: { type: "string" }, description: "Standards to check against", default: ["GDPR", "HIPAA", "SOC2"] },
      },
      required: ["content"],
    },
  },
  {
    name: "openai_content_filter_create",
    description: "Create custom content filter with rules",
    inputSchema: {
      type: "object",
      properties: {
        filter_name: { type: "string", description: "Name for the filter" },
        rules: { type: "array", description: "Array of filter rules" },
        action: { type: "string", enum: ["block", "warn", "flag"], default: "warn" },
      },
      required: ["filter_name", "rules"],
    },
  },
  {
    name: "openai_content_filter_test",
    description: "Test content against custom filter",
    inputSchema: {
      type: "object",
      properties: {
        filter_name: { type: "string", description: "Filter to test against" },
        content: { type: "string", description: "Content to test" },
      },
      required: ["filter_name", "content"],
    },
  },
  {
    name: "openai_safety_report",
    description: "Generate comprehensive safety report for content",
    inputSchema: {
      type: "object",
      properties: {
        content: { type: "string", description: "Content to analyze" },
        report_type: { type: "string", enum: ["summary", "detailed", "executive"], default: "detailed" },
      },
      required: ["content"],
    },
  },
  {
    name: "openai_audit_log_export",
    description: "Export audit logs for compliance",
    inputSchema: {
      type: "object",
      properties: {
        start_date: { type: "string", description: "Start date (ISO format)" },
        end_date: { type: "string", description: "End date (ISO format)" },
        format: { type: "string", enum: ["json", "csv", "pdf"], default: "json" },
        include_pii: { type: "boolean", description: "Include PII in export", default: false },
      },
      required: ["start_date", "end_date"],
    },
  },

  // ==================== MONITORING & OBSERVABILITY ====================
  {
    name: "openai_monitor_get_metrics",
    description: "Get comprehensive metrics for OpenAI API usage",
    inputSchema: {
      type: "object",
      properties: {
        time_range: { type: "string", enum: ["1h", "24h", "7d", "30d"], default: "24h" },
        metrics: { type: "array", items: { type: "string" }, description: "Specific metrics to retrieve" },
      },
      required: [],
    },
  },
  {
    name: "openai_monitor_get_errors",
    description: "Get error logs and statistics",
    inputSchema: {
      type: "object",
      properties: {
        time_range: { type: "string", enum: ["1h", "24h", "7d", "30d"], default: "24h" },
        error_types: { type: "array", items: { type: "string" }, description: "Filter by error types" },
        limit: { type: "number", default: 100 },
      },
      required: [],
    },
  },
  {
    name: "openai_monitor_get_latency",
    description: "Get latency statistics and percentiles",
    inputSchema: {
      type: "object",
      properties: {
        time_range: { type: "string", enum: ["1h", "24h", "7d", "30d"], default: "24h" },
        model: { type: "string", description: "Filter by model" },
      },
      required: [],
    },
  },
  {
    name: "openai_monitor_get_throughput",
    description: "Get request throughput and rate statistics",
    inputSchema: {
      type: "object",
      properties: {
        time_range: { type: "string", enum: ["1h", "24h", "7d", "30d"], default: "24h" },
        granularity: { type: "string", enum: ["minute", "hour", "day"], default: "hour" },
      },
      required: [],
    },
  },
  {
    name: "openai_monitor_get_success_rate",
    description: "Get success rate and failure statistics",
    inputSchema: {
      type: "object",
      properties: {
        time_range: { type: "string", enum: ["1h", "24h", "7d", "30d"], default: "24h" },
        model: { type: "string", description: "Filter by model" },
      },
      required: [],
    },
  },
  {
    name: "openai_monitor_set_alert",
    description: "Configure monitoring alerts and thresholds",
    inputSchema: {
      type: "object",
      properties: {
        alert_name: { type: "string", description: "Name for the alert" },
        metric: { type: "string", description: "Metric to monitor" },
        threshold: { type: "number", description: "Alert threshold" },
        condition: { type: "string", enum: ["above", "below", "equals"], default: "above" },
        notification_method: { type: "string", enum: ["email", "webhook", "log"], default: "log" },
      },
      required: ["alert_name", "metric", "threshold"],
    },
  },
  {
    name: "openai_monitor_get_alerts",
    description: "Get active alerts and alert history",
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["active", "resolved", "all"], default: "active" },
        limit: { type: "number", default: 50 },
      },
      required: [],
    },
  },
  {
    name: "openai_monitor_export_logs",
    description: "Export monitoring logs for analysis",
    inputSchema: {
      type: "object",
      properties: {
        start_date: { type: "string", description: "Start date (ISO format)" },
        end_date: { type: "string", description: "End date (ISO format)" },
        format: { type: "string", enum: ["json", "csv", "ndjson"], default: "json" },
        log_level: { type: "string", enum: ["debug", "info", "warn", "error"], default: "info" },
      },
      required: ["start_date", "end_date"],
    },
  },
  {
    name: "openai_monitor_get_trace",
    description: "Get distributed trace for a request",
    inputSchema: {
      type: "object",
      properties: {
        trace_id: { type: "string", description: "Trace ID to retrieve" },
        include_spans: { type: "boolean", default: true },
      },
      required: ["trace_id"],
    },
  },
  {
    name: "openai_monitor_get_dashboard",
    description: "Get monitoring dashboard data",
    inputSchema: {
      type: "object",
      properties: {
        dashboard_type: { type: "string", enum: ["overview", "performance", "costs", "errors"], default: "overview" },
        time_range: { type: "string", enum: ["1h", "24h", "7d", "30d"], default: "24h" },
      },
      required: [],
    },
  },
  {
    name: "openai_monitor_get_anomalies",
    description: "Detect anomalies in metrics using ML",
    inputSchema: {
      type: "object",
      properties: {
        metric: { type: "string", description: "Metric to analyze" },
        time_range: { type: "string", enum: ["1h", "24h", "7d", "30d"], default: "24h" },
        sensitivity: { type: "string", enum: ["low", "medium", "high"], default: "medium" },
      },
      required: ["metric"],
    },
  },
  {
    name: "openai_monitor_get_health",
    description: "Get overall system health status",
    inputSchema: {
      type: "object",
      properties: {
        include_details: { type: "boolean", default: true },
      },
      required: [],
    },
  },

  // ==================== PROMPT ENGINEERING ====================
  {
    name: "openai_prompt_optimize",
    description: "AI-powered prompt optimization for better results",
    inputSchema: {
      type: "object",
      properties: {
        prompt: { type: "string", description: "Prompt to optimize" },
        goal: { type: "string", description: "Optimization goal", enum: ["clarity", "conciseness", "specificity", "creativity", "all"], default: "all" },
        model: { type: "string", default: "gpt-4o-mini" },
      },
      required: ["prompt"],
    },
  },
  {
    name: "openai_prompt_shorten",
    description: "Shorten prompt while preserving meaning",
    inputSchema: {
      type: "object",
      properties: {
        prompt: { type: "string", description: "Prompt to shorten" },
        target_reduction: { type: "number", description: "Target reduction percentage", default: 30 },
      },
      required: ["prompt"],
    },
  },
  {
    name: "openai_prompt_expand",
    description: "Expand prompt with more detail and context",
    inputSchema: {
      type: "object",
      properties: {
        prompt: { type: "string", description: "Prompt to expand" },
        expansion_type: { type: "string", enum: ["examples", "context", "constraints", "all"], default: "all" },
      },
      required: ["prompt"],
    },
  },
  {
    name: "openai_prompt_test",
    description: "Test prompt with multiple models and compare results",
    inputSchema: {
      type: "object",
      properties: {
        prompt: { type: "string", description: "Prompt to test" },
        models: { type: "array", items: { type: "string" }, default: ["gpt-4o-mini", "gpt-4o", "gpt-4-turbo"] },
        test_cases: { type: "array", description: "Optional test variations" },
      },
      required: ["prompt"],
    },
  },
  {
    name: "openai_prompt_compare",
    description: "Compare multiple prompt variations",
    inputSchema: {
      type: "object",
      properties: {
        prompts: { type: "array", items: { type: "string" }, description: "Prompts to compare" },
        evaluation_criteria: { type: "array", items: { type: "string" }, default: ["clarity", "effectiveness", "token_efficiency"] },
      },
      required: ["prompts"],
    },
  },
  {
    name: "openai_prompt_suggest_improvements",
    description: "Get AI suggestions for prompt improvements",
    inputSchema: {
      type: "object",
      properties: {
        prompt: { type: "string", description: "Prompt to analyze" },
        focus_areas: { type: "array", items: { type: "string" }, default: ["structure", "clarity", "specificity", "examples"] },
      },
      required: ["prompt"],
    },
  },
  {
    name: "openai_prompt_extract_variables",
    description: "Extract variables and parameters from prompt template",
    inputSchema: {
      type: "object",
      properties: {
        prompt_template: { type: "string", description: "Prompt template with variables" },
        variable_format: { type: "string", enum: ["{{var}}", "{var}", "$var", "auto"], default: "auto" },
      },
      required: ["prompt_template"],
    },
  },
  {
    name: "openai_prompt_generate_examples",
    description: "Generate example inputs/outputs for prompt",
    inputSchema: {
      type: "object",
      properties: {
        prompt: { type: "string", description: "Prompt to generate examples for" },
        num_examples: { type: "number", default: 3 },
        example_type: { type: "string", enum: ["input", "output", "both"], default: "both" },
      },
      required: ["prompt"],
    },
  },
  {
    name: "openai_prompt_validate",
    description: "Validate prompt for common issues and best practices",
    inputSchema: {
      type: "object",
      properties: {
        prompt: { type: "string", description: "Prompt to validate" },
        validation_level: { type: "string", enum: ["basic", "strict", "comprehensive"], default: "comprehensive" },
      },
      required: ["prompt"],
    },
  },
  {
    name: "openai_prompt_translate",
    description: "Translate prompt to different language while preserving intent",
    inputSchema: {
      type: "object",
      properties: {
        prompt: { type: "string", description: "Prompt to translate" },
        target_language: { type: "string", description: "Target language" },
        preserve_formatting: { type: "boolean", default: true },
      },
      required: ["prompt", "target_language"],
    },
  },

  // ==================== ADVANCED EMBEDDINGS ====================
  {
    name: "openai_embedding_similarity",
    description: "Calculate similarity between embeddings",
    inputSchema: {
      type: "object",
      properties: {
        text1: { type: "string", description: "First text" },
        text2: { type: "string", description: "Second text" },
        model: { type: "string", default: "text-embedding-3-small" },
        similarity_metric: { type: "string", enum: ["cosine", "euclidean", "dot_product"], default: "cosine" },
      },
      required: ["text1", "text2"],
    },
  },
  {
    name: "openai_embedding_cluster",
    description: "Cluster embeddings using k-means or hierarchical clustering",
    inputSchema: {
      type: "object",
      properties: {
        texts: { type: "array", items: { type: "string" }, description: "Texts to cluster" },
        num_clusters: { type: "number", description: "Number of clusters", default: 3 },
        method: { type: "string", enum: ["kmeans", "hierarchical"], default: "kmeans" },
        model: { type: "string", default: "text-embedding-3-small" },
      },
      required: ["texts"],
    },
  },
  {
    name: "openai_embedding_search",
    description: "Semantic search using embeddings",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" },
        documents: { type: "array", items: { type: "string" }, description: "Documents to search" },
        top_k: { type: "number", default: 5 },
        model: { type: "string", default: "text-embedding-3-small" },
      },
      required: ["query", "documents"],
    },
  },
  {
    name: "openai_embedding_outlier_detection",
    description: "Detect outliers in embedding space",
    inputSchema: {
      type: "object",
      properties: {
        texts: { type: "array", items: { type: "string" }, description: "Texts to analyze" },
        threshold: { type: "number", description: "Outlier threshold (std devs)", default: 2.5 },
        model: { type: "string", default: "text-embedding-3-small" },
      },
      required: ["texts"],
    },
  },
  {
    name: "openai_embedding_dimensionality_reduction",
    description: "Reduce embedding dimensions using PCA or t-SNE",
    inputSchema: {
      type: "object",
      properties: {
        texts: { type: "array", items: { type: "string" }, description: "Texts to reduce" },
        target_dimensions: { type: "number", default: 2 },
        method: { type: "string", enum: ["pca", "tsne"], default: "pca" },
        model: { type: "string", default: "text-embedding-3-small" },
      },
      required: ["texts"],
    },
  },
  {
    name: "openai_embedding_visualization",
    description: "Generate visualization data for embeddings",
    inputSchema: {
      type: "object",
      properties: {
        texts: { type: "array", items: { type: "string" }, description: "Texts to visualize" },
        labels: { type: "array", items: { type: "string" }, description: "Optional labels" },
        model: { type: "string", default: "text-embedding-3-small" },
      },
      required: ["texts"],
    },
  },
  {
    name: "openai_embedding_batch_similarity",
    description: "Calculate pairwise similarities for batch of texts",
    inputSchema: {
      type: "object",
      properties: {
        texts: { type: "array", items: { type: "string" }, description: "Texts to compare" },
        model: { type: "string", default: "text-embedding-3-small" },
      },
      required: ["texts"],
    },
  },
  {
    name: "openai_embedding_index_create",
    description: "Create searchable embedding index",
    inputSchema: {
      type: "object",
      properties: {
        index_name: { type: "string", description: "Name for the index" },
        documents: { type: "array", items: { type: "string" }, description: "Documents to index" },
        model: { type: "string", default: "text-embedding-3-small" },
        metadata: { type: "array", description: "Optional metadata for each document" },
      },
      required: ["index_name", "documents"],
    },
  },

  // ==================== REALTIME API ====================
  {
    name: "openai_realtime_session_create",
    description: "Create a new Realtime API session for voice conversations",
    inputSchema: {
      type: "object",
      properties: {
        model: { type: "string", default: "gpt-4o-realtime-preview" },
        voice: { type: "string", enum: ["alloy", "echo", "fable", "onyx", "nova", "shimmer"], default: "alloy" },
        instructions: { type: "string", description: "System instructions for the session" },
        modalities: { type: "array", items: { type: "string" }, default: ["text", "audio"] },
      },
      required: [],
    },
  },
  {
    name: "openai_realtime_session_update",
    description: "Update Realtime API session configuration",
    inputSchema: {
      type: "object",
      properties: {
        session_id: { type: "string", description: "Session ID" },
        voice: { type: "string", enum: ["alloy", "echo", "fable", "onyx", "nova", "shimmer"] },
        instructions: { type: "string", description: "Updated system instructions" },
        temperature: { type: "number", description: "Temperature (0-2)" },
      },
      required: ["session_id"],
    },
  },
  {
    name: "openai_realtime_audio_send",
    description: "Send audio data to Realtime API session",
    inputSchema: {
      type: "object",
      properties: {
        session_id: { type: "string", description: "Session ID" },
        audio_data: { type: "string", description: "Base64 encoded audio (PCM16, 24kHz)" },
        format: { type: "string", enum: ["pcm16", "g711_ulaw", "g711_alaw"], default: "pcm16" },
      },
      required: ["session_id", "audio_data"],
    },
  },
  {
    name: "openai_realtime_audio_receive",
    description: "Receive audio response from Realtime API",
    inputSchema: {
      type: "object",
      properties: {
        session_id: { type: "string", description: "Session ID" },
        timeout_ms: { type: "number", default: 5000 },
      },
      required: ["session_id"],
    },
  },
  {
    name: "openai_realtime_text_send",
    description: "Send text message to Realtime API session",
    inputSchema: {
      type: "object",
      properties: {
        session_id: { type: "string", description: "Session ID" },
        text: { type: "string", description: "Text message to send" },
      },
      required: ["session_id", "text"],
    },
  },
  {
    name: "openai_realtime_text_receive",
    description: "Receive text response from Realtime API",
    inputSchema: {
      type: "object",
      properties: {
        session_id: { type: "string", description: "Session ID" },
        timeout_ms: { type: "number", default: 5000 },
      },
      required: ["session_id"],
    },
  },
  {
    name: "openai_realtime_function_call",
    description: "Handle function calling in Realtime API session",
    inputSchema: {
      type: "object",
      properties: {
        session_id: { type: "string", description: "Session ID" },
        functions: { type: "array", description: "Available functions" },
      },
      required: ["session_id", "functions"],
    },
  },
  {
    name: "openai_realtime_interrupt",
    description: "Interrupt ongoing Realtime API response",
    inputSchema: {
      type: "object",
      properties: {
        session_id: { type: "string", description: "Session ID" },
      },
      required: ["session_id"],
    },
  },
  {
    name: "openai_realtime_session_close",
    description: "Close Realtime API session",
    inputSchema: {
      type: "object",
      properties: {
        session_id: { type: "string", description: "Session ID" },
      },
      required: ["session_id"],
    },
  },
  {
    name: "openai_realtime_get_transcript",
    description: "Get conversation transcript from Realtime API session",
    inputSchema: {
      type: "object",
      properties: {
        session_id: { type: "string", description: "Session ID" },
        format: { type: "string", enum: ["text", "json", "srt"], default: "text" },
      },
      required: ["session_id"],
    },
  },
  {
    name: "openai_realtime_configure_voice",
    description: "Configure voice settings for Realtime API",
    inputSchema: {
      type: "object",
      properties: {
        session_id: { type: "string", description: "Session ID" },
        voice: { type: "string", enum: ["alloy", "echo", "fable", "onyx", "nova", "shimmer"] },
        speed: { type: "number", description: "Speech speed (0.25-4.0)", default: 1.0 },
      },
      required: ["session_id"],
    },
  },
  {
    name: "openai_realtime_get_metrics",
    description: "Get performance metrics for Realtime API session",
    inputSchema: {
      type: "object",
      properties: {
        session_id: { type: "string", description: "Session ID" },
      },
      required: ["session_id"],
    },
  },

  // ==================== VISION API ====================
  {
    name: "openai_vision_analyze_image",
    description: "Comprehensive image analysis using GPT-4 Vision",
    inputSchema: {
      type: "object",
      properties: {
        image_url: { type: "string", description: "Image URL or base64 data URL" },
        prompt: { type: "string", description: "Analysis prompt", default: "Analyze this image in detail" },
        model: { type: "string", default: "gpt-4o" },
        detail: { type: "string", enum: ["low", "high", "auto"], default: "auto" },
      },
      required: ["image_url"],
    },
  },
  {
    name: "openai_vision_describe_image",
    description: "Generate detailed description of image",
    inputSchema: {
      type: "object",
      properties: {
        image_url: { type: "string", description: "Image URL or base64 data URL" },
        style: { type: "string", enum: ["concise", "detailed", "creative"], default: "detailed" },
        model: { type: "string", default: "gpt-4o" },
      },
      required: ["image_url"],
    },
  },
  {
    name: "openai_vision_extract_text",
    description: "Extract text from image (OCR)",
    inputSchema: {
      type: "object",
      properties: {
        image_url: { type: "string", description: "Image URL or base64 data URL" },
        language: { type: "string", description: "Expected language (optional)" },
        model: { type: "string", default: "gpt-4o" },
      },
      required: ["image_url"],
    },
  },
  {
    name: "openai_vision_detect_objects",
    description: "Detect and identify objects in image",
    inputSchema: {
      type: "object",
      properties: {
        image_url: { type: "string", description: "Image URL or base64 data URL" },
        categories: { type: "array", items: { type: "string" }, description: "Object categories to focus on (optional)" },
        model: { type: "string", default: "gpt-4o" },
      },
      required: ["image_url"],
    },
  },
  {
    name: "openai_vision_compare_images",
    description: "Compare two images and identify differences/similarities",
    inputSchema: {
      type: "object",
      properties: {
        image_url_1: { type: "string", description: "First image URL" },
        image_url_2: { type: "string", description: "Second image URL" },
        focus: { type: "string", enum: ["differences", "similarities", "both"], default: "both" },
        model: { type: "string", default: "gpt-4o" },
      },
      required: ["image_url_1", "image_url_2"],
    },
  },
  {
    name: "openai_vision_generate_caption",
    description: "Generate caption for image",
    inputSchema: {
      type: "object",
      properties: {
        image_url: { type: "string", description: "Image URL or base64 data URL" },
        style: { type: "string", enum: ["short", "medium", "long"], default: "medium" },
        tone: { type: "string", enum: ["formal", "casual", "creative"], default: "casual" },
        model: { type: "string", default: "gpt-4o" },
      },
      required: ["image_url"],
    },
  },
  {
    name: "openai_vision_answer_question",
    description: "Answer questions about image content",
    inputSchema: {
      type: "object",
      properties: {
        image_url: { type: "string", description: "Image URL or base64 data URL" },
        question: { type: "string", description: "Question about the image" },
        model: { type: "string", default: "gpt-4o" },
      },
      required: ["image_url", "question"],
    },
  },
  {
    name: "openai_vision_batch_analyze",
    description: "Analyze multiple images in batch",
    inputSchema: {
      type: "object",
      properties: {
        image_urls: { type: "array", items: { type: "string" }, description: "Array of image URLs" },
        prompt: { type: "string", description: "Analysis prompt for all images" },
        model: { type: "string", default: "gpt-4o" },
      },
      required: ["image_urls", "prompt"],
    },
  },

  // ==================== ADVANCED FINE-TUNING ====================
  {
    name: "openai_fine_tuning_validate_data",
    description: "Validate training data format for fine-tuning",
    inputSchema: {
      type: "object",
      properties: {
        training_data: { type: "array", description: "Training data to validate" },
        model: { type: "string", description: "Target model for fine-tuning" },
      },
      required: ["training_data"],
    },
  },
  {
    name: "openai_fine_tuning_estimate_cost",
    description: "Estimate cost of fine-tuning job",
    inputSchema: {
      type: "object",
      properties: {
        training_file_id: { type: "string", description: "Training file ID" },
        model: { type: "string", default: "gpt-4o-mini-2024-07-18" },
        n_epochs: { type: "number", default: 3 },
      },
      required: ["training_file_id"],
    },
  },
  {
    name: "openai_fine_tuning_get_metrics",
    description: "Get detailed metrics for fine-tuning job",
    inputSchema: {
      type: "object",
      properties: {
        fine_tuning_job_id: { type: "string", description: "Fine-tuning job ID" },
      },
      required: ["fine_tuning_job_id"],
    },
  },
  {
    name: "openai_fine_tuning_compare_models",
    description: "Compare base model vs fine-tuned model performance",
    inputSchema: {
      type: "object",
      properties: {
        base_model: { type: "string", description: "Base model name" },
        fine_tuned_model: { type: "string", description: "Fine-tuned model name" },
        test_prompts: { type: "array", items: { type: "string" }, description: "Test prompts" },
      },
      required: ["base_model", "fine_tuned_model", "test_prompts"],
    },
  },
  {
    name: "openai_fine_tuning_analyze_results",
    description: "Analyze fine-tuning results and provide recommendations",
    inputSchema: {
      type: "object",
      properties: {
        fine_tuning_job_id: { type: "string", description: "Fine-tuning job ID" },
      },
      required: ["fine_tuning_job_id"],
    },
  },
  {
    name: "openai_fine_tuning_export_model",
    description: "Export fine-tuned model details and metadata",
    inputSchema: {
      type: "object",
      properties: {
        fine_tuned_model: { type: "string", description: "Fine-tuned model name" },
        include_metrics: { type: "boolean", default: true },
      },
      required: ["fine_tuned_model"],
    },
  },
  {
    name: "openai_fine_tuning_list_checkpoints",
    description: "List checkpoints for fine-tuning job",
    inputSchema: {
      type: "object",
      properties: {
        fine_tuning_job_id: { type: "string", description: "Fine-tuning job ID" },
      },
      required: ["fine_tuning_job_id"],
    },
  },
  {
    name: "openai_fine_tuning_get_best_checkpoint",
    description: "Get best performing checkpoint from fine-tuning job",
    inputSchema: {
      type: "object",
      properties: {
        fine_tuning_job_id: { type: "string", description: "Fine-tuning job ID" },
        metric: { type: "string", enum: ["loss", "accuracy"], default: "loss" },
      },
      required: ["fine_tuning_job_id"],
    },
  },
  {
    name: "openai_fine_tuning_prepare_dataset",
    description: "Prepare and format dataset for fine-tuning",
    inputSchema: {
      type: "object",
      properties: {
        data: { type: "array", description: "Raw data to prepare" },
        format: { type: "string", enum: ["chat", "completion"], default: "chat" },
        system_message: { type: "string", description: "System message for chat format" },
      },
      required: ["data"],
    },
  },
  {
    name: "openai_fine_tuning_hyperparameter_search",
    description: "Suggest optimal hyperparameters for fine-tuning",
    inputSchema: {
      type: "object",
      properties: {
        training_file_id: { type: "string", description: "Training file ID" },
        model: { type: "string", default: "gpt-4o-mini-2024-07-18" },
        dataset_size: { type: "number", description: "Number of training examples" },
      },
      required: ["training_file_id"],
    },
  },

  // ==================== ADVANCED BATCH ====================
  {
    name: "openai_batch_estimate_cost",
    description: "Estimate cost of batch processing job",
    inputSchema: {
      type: "object",
      properties: {
        requests: { type: "array", description: "Array of requests to process" },
        model: { type: "string", default: "gpt-4o-mini" },
      },
      required: ["requests"],
    },
  },
  {
    name: "openai_batch_monitor",
    description: "Monitor batch job progress with detailed metrics",
    inputSchema: {
      type: "object",
      properties: {
        batch_id: { type: "string", description: "Batch ID" },
        include_errors: { type: "boolean", default: true },
      },
      required: ["batch_id"],
    },
  },
  {
    name: "openai_batch_retry_failed",
    description: "Retry failed requests from batch job",
    inputSchema: {
      type: "object",
      properties: {
        batch_id: { type: "string", description: "Original batch ID" },
        max_retries: { type: "number", default: 3 },
      },
      required: ["batch_id"],
    },
  },
  {
    name: "openai_batch_split_large",
    description: "Split large batch into smaller chunks",
    inputSchema: {
      type: "object",
      properties: {
        requests: { type: "array", description: "Large array of requests" },
        chunk_size: { type: "number", default: 50000 },
      },
      required: ["requests"],
    },
  },
  {
    name: "openai_batch_merge_results",
    description: "Merge results from multiple batch jobs",
    inputSchema: {
      type: "object",
      properties: {
        batch_ids: { type: "array", items: { type: "string" }, description: "Batch IDs to merge" },
        output_format: { type: "string", enum: ["json", "jsonl"], default: "jsonl" },
      },
      required: ["batch_ids"],
    },
  },
  {
    name: "openai_batch_schedule",
    description: "Schedule batch job for future execution",
    inputSchema: {
      type: "object",
      properties: {
        input_file_id: { type: "string", description: "Input file ID" },
        endpoint: { type: "string", description: "API endpoint" },
        schedule_time: { type: "string", description: "ISO 8601 timestamp" },
      },
      required: ["input_file_id", "endpoint", "schedule_time"],
    },
  },
  {
    name: "openai_batch_optimize",
    description: "Optimize batch requests for cost and performance",
    inputSchema: {
      type: "object",
      properties: {
        requests: { type: "array", description: "Requests to optimize" },
        optimization_goal: { type: "string", enum: ["cost", "speed", "balanced"], default: "balanced" },
      },
      required: ["requests"],
    },
  },
  {
    name: "openai_batch_analytics",
    description: "Get analytics for batch processing history",
    inputSchema: {
      type: "object",
      properties: {
        time_range: { type: "string", enum: ["24h", "7d", "30d", "all"], default: "7d" },
        include_costs: { type: "boolean", default: true },
      },
      required: [],
    },
  },

  // ==================== AGENTS SDK ====================
  {
    name: "openai_agent_create",
    description: "Create an AI agent with tools and instructions",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Agent name" },
        instructions: { type: "string", description: "Agent instructions/system prompt" },
        tools: { type: "array", description: "Tools available to agent" },
        model: { type: "string", default: "gpt-4o" },
      },
      required: ["name", "instructions"],
    },
  },
  {
    name: "openai_agent_run",
    description: "Run an agent with a task",
    inputSchema: {
      type: "object",
      properties: {
        agent_id: { type: "string", description: "Agent ID (assistant ID)" },
        task: { type: "string", description: "Task for the agent" },
        context: { type: "object", description: "Additional context" },
      },
      required: ["agent_id", "task"],
    },
  },
  {
    name: "openai_agent_stream",
    description: "Run agent with streaming responses",
    inputSchema: {
      type: "object",
      properties: {
        agent_id: { type: "string", description: "Agent ID" },
        task: { type: "string", description: "Task for the agent" },
      },
      required: ["agent_id", "task"],
    },
  },
  {
    name: "openai_agent_with_tools",
    description: "Run agent with specific tools enabled",
    inputSchema: {
      type: "object",
      properties: {
        agent_id: { type: "string", description: "Agent ID" },
        task: { type: "string", description: "Task" },
        tools: { type: "array", description: "Tools to enable" },
      },
      required: ["agent_id", "task", "tools"],
    },
  },
  {
    name: "openai_agent_handoff",
    description: "Hand off task from one agent to another",
    inputSchema: {
      type: "object",
      properties: {
        from_agent_id: { type: "string", description: "Source agent ID" },
        to_agent_id: { type: "string", description: "Target agent ID" },
        task: { type: "string", description: "Task to hand off" },
        context: { type: "object", description: "Context to transfer" },
      },
      required: ["from_agent_id", "to_agent_id", "task"],
    },
  },
  {
    name: "openai_agent_parallel",
    description: "Run multiple agents in parallel",
    inputSchema: {
      type: "object",
      properties: {
        agents: { type: "array", description: "Array of {agent_id, task} objects" },
        merge_strategy: { type: "string", enum: ["concat", "best", "vote"], default: "concat" },
      },
      required: ["agents"],
    },
  },
  {
    name: "openai_agent_sequential",
    description: "Run agents in sequence (pipeline)",
    inputSchema: {
      type: "object",
      properties: {
        agents: { type: "array", description: "Array of {agent_id, task} objects in order" },
        pass_output: { type: "boolean", default: true, description: "Pass output to next agent" },
      },
      required: ["agents"],
    },
  },
  {
    name: "openai_agent_conditional",
    description: "Run agent based on condition",
    inputSchema: {
      type: "object",
      properties: {
        condition: { type: "string", description: "Condition to evaluate" },
        if_agent_id: { type: "string", description: "Agent to run if true" },
        else_agent_id: { type: "string", description: "Agent to run if false" },
        task: { type: "string", description: "Task" },
      },
      required: ["condition", "if_agent_id", "task"],
    },
  },
  {
    name: "openai_agent_loop",
    description: "Run agent in a loop until condition met",
    inputSchema: {
      type: "object",
      properties: {
        agent_id: { type: "string", description: "Agent ID" },
        task: { type: "string", description: "Task" },
        max_iterations: { type: "number", default: 10 },
        stop_condition: { type: "string", description: "Condition to stop loop" },
      },
      required: ["agent_id", "task"],
    },
  },
  {
    name: "openai_agent_memory",
    description: "Manage agent memory/state",
    inputSchema: {
      type: "object",
      properties: {
        agent_id: { type: "string", description: "Agent ID" },
        operation: { type: "string", enum: ["get", "set", "clear"], default: "get" },
        key: { type: "string", description: "Memory key" },
        value: { type: "string", description: "Memory value (for set)" },
      },
      required: ["agent_id", "operation"],
    },
  },
  {
    name: "openai_agent_state",
    description: "Get or update agent state",
    inputSchema: {
      type: "object",
      properties: {
        agent_id: { type: "string", description: "Agent ID" },
        state: { type: "object", description: "State to set (optional)" },
      },
      required: ["agent_id"],
    },
  },
  {
    name: "openai_agent_monitor",
    description: "Monitor agent performance and usage",
    inputSchema: {
      type: "object",
      properties: {
        agent_id: { type: "string", description: "Agent ID" },
        time_range: { type: "string", enum: ["1h", "24h", "7d"], default: "24h" },
      },
      required: ["agent_id"],
    },
  },
  {
    name: "openai_agent_optimize",
    description: "Optimize agent configuration",
    inputSchema: {
      type: "object",
      properties: {
        agent_id: { type: "string", description: "Agent ID" },
        optimization_goal: { type: "string", enum: ["cost", "speed", "quality"], default: "balanced" },
      },
      required: ["agent_id"],
    },
  },
  {
    name: "openai_agent_export",
    description: "Export agent configuration",
    inputSchema: {
      type: "object",
      properties: {
        agent_id: { type: "string", description: "Agent ID" },
        include_history: { type: "boolean", default: false },
      },
      required: ["agent_id"],
    },
  },
  {
    name: "openai_agent_import",
    description: "Import agent configuration",
    inputSchema: {
      type: "object",
      properties: {
        config: { type: "object", description: "Agent configuration to import" },
        name: { type: "string", description: "New agent name" },
      },
      required: ["config"],
    },
  },

  // ==================== ADVANCED ASSISTANTS ====================
  {
    name: "openai_assistant_clone",
    description: "Clone an existing assistant",
    inputSchema: {
      type: "object",
      properties: {
        assistant_id: { type: "string", description: "Assistant ID to clone" },
        name: { type: "string", description: "New assistant name" },
      },
      required: ["assistant_id"],
    },
  },
  {
    name: "openai_assistant_export",
    description: "Export assistant configuration to JSON",
    inputSchema: {
      type: "object",
      properties: {
        assistant_id: { type: "string", description: "Assistant ID" },
        include_files: { type: "boolean", default: false },
      },
      required: ["assistant_id"],
    },
  },
  {
    name: "openai_assistant_import",
    description: "Import assistant from JSON configuration",
    inputSchema: {
      type: "object",
      properties: {
        config: { type: "object", description: "Assistant configuration" },
      },
      required: ["config"],
    },
  },
  {
    name: "openai_assistant_test",
    description: "Test assistant with sample inputs",
    inputSchema: {
      type: "object",
      properties: {
        assistant_id: { type: "string", description: "Assistant ID" },
        test_cases: { type: "array", description: "Array of test inputs" },
      },
      required: ["assistant_id", "test_cases"],
    },
  },
  {
    name: "openai_assistant_optimize",
    description: "Optimize assistant configuration",
    inputSchema: {
      type: "object",
      properties: {
        assistant_id: { type: "string", description: "Assistant ID" },
        optimization_goal: { type: "string", enum: ["cost", "speed", "quality"], default: "balanced" },
      },
      required: ["assistant_id"],
    },
  },
  {
    name: "openai_assistant_analytics",
    description: "Get usage analytics for assistant",
    inputSchema: {
      type: "object",
      properties: {
        assistant_id: { type: "string", description: "Assistant ID" },
        time_range: { type: "string", enum: ["24h", "7d", "30d"], default: "7d" },
      },
      required: ["assistant_id"],
    },
  },
  {
    name: "openai_assistant_version",
    description: "Create a new version of assistant",
    inputSchema: {
      type: "object",
      properties: {
        assistant_id: { type: "string", description: "Assistant ID" },
        version_name: { type: "string", description: "Version name" },
        changes: { type: "object", description: "Changes to apply" },
      },
      required: ["assistant_id", "version_name"],
    },
  },
  {
    name: "openai_assistant_rollback",
    description: "Rollback assistant to previous version",
    inputSchema: {
      type: "object",
      properties: {
        assistant_id: { type: "string", description: "Assistant ID" },
        version_name: { type: "string", description: "Version to rollback to" },
      },
      required: ["assistant_id", "version_name"],
    },
  },
  {
    name: "openai_assistant_compare",
    description: "Compare two assistants",
    inputSchema: {
      type: "object",
      properties: {
        assistant_id_1: { type: "string", description: "First assistant ID" },
        assistant_id_2: { type: "string", description: "Second assistant ID" },
        test_cases: { type: "array", description: "Test cases for comparison" },
      },
      required: ["assistant_id_1", "assistant_id_2"],
    },
  },
  {
    name: "openai_assistant_benchmark",
    description: "Benchmark assistant performance",
    inputSchema: {
      type: "object",
      properties: {
        assistant_id: { type: "string", description: "Assistant ID" },
        benchmark_suite: { type: "string", enum: ["speed", "quality", "cost", "comprehensive"], default: "comprehensive" },
      },
      required: ["assistant_id"],
    },
  },
  {
    name: "openai_assistant_monitor",
    description: "Monitor assistant in real-time",
    inputSchema: {
      type: "object",
      properties: {
        assistant_id: { type: "string", description: "Assistant ID" },
        metrics: { type: "array", description: "Metrics to monitor" },
      },
      required: ["assistant_id"],
    },
  },
  {
    name: "openai_assistant_audit",
    description: "Get audit log for assistant",
    inputSchema: {
      type: "object",
      properties: {
        assistant_id: { type: "string", description: "Assistant ID" },
        time_range: { type: "string", enum: ["24h", "7d", "30d", "all"], default: "7d" },
      },
      required: ["assistant_id"],
    },
  },

  // ==================== ADVANCED VECTOR STORES ====================
  {
    name: "openai_vector_search",
    description: "Search vector store with query",
    inputSchema: {
      type: "object",
      properties: {
        vector_store_id: { type: "string", description: "Vector store ID" },
        query: { type: "string", description: "Search query" },
        limit: { type: "number", default: 10 },
      },
      required: ["vector_store_id", "query"],
    },
  },
  {
    name: "openai_vector_similarity",
    description: "Find similar vectors in store",
    inputSchema: {
      type: "object",
      properties: {
        vector_store_id: { type: "string", description: "Vector store ID" },
        vector: { type: "array", description: "Query vector" },
        limit: { type: "number", default: 10 },
      },
      required: ["vector_store_id", "vector"],
    },
  },
  {
    name: "openai_vector_cluster",
    description: "Cluster vectors in store",
    inputSchema: {
      type: "object",
      properties: {
        vector_store_id: { type: "string", description: "Vector store ID" },
        num_clusters: { type: "number", default: 5 },
      },
      required: ["vector_store_id"],
    },
  },
  {
    name: "openai_vector_deduplicate",
    description: "Remove duplicate vectors",
    inputSchema: {
      type: "object",
      properties: {
        vector_store_id: { type: "string", description: "Vector store ID" },
        similarity_threshold: { type: "number", default: 0.95 },
      },
      required: ["vector_store_id"],
    },
  },
  {
    name: "openai_vector_merge",
    description: "Merge multiple vector stores",
    inputSchema: {
      type: "object",
      properties: {
        source_store_ids: { type: "array", items: { type: "string" }, description: "Source store IDs" },
        target_store_name: { type: "string", description: "Target store name" },
      },
      required: ["source_store_ids", "target_store_name"],
    },
  },
  {
    name: "openai_vector_export",
    description: "Export vector store data",
    inputSchema: {
      type: "object",
      properties: {
        vector_store_id: { type: "string", description: "Vector store ID" },
        format: { type: "string", enum: ["json", "csv"], default: "json" },
      },
      required: ["vector_store_id"],
    },
  },
  {
    name: "openai_vector_import",
    description: "Import data into vector store",
    inputSchema: {
      type: "object",
      properties: {
        vector_store_id: { type: "string", description: "Vector store ID" },
        data: { type: "array", description: "Data to import" },
        format: { type: "string", enum: ["json", "csv"], default: "json" },
      },
      required: ["vector_store_id", "data"],
    },
  },
  {
    name: "openai_vector_optimize",
    description: "Optimize vector store performance",
    inputSchema: {
      type: "object",
      properties: {
        vector_store_id: { type: "string", description: "Vector store ID" },
        optimization_type: { type: "string", enum: ["speed", "accuracy", "storage"], default: "balanced" },
      },
      required: ["vector_store_id"],
    },
  },
  {
    name: "openai_vector_analytics",
    description: "Get vector store analytics",
    inputSchema: {
      type: "object",
      properties: {
        vector_store_id: { type: "string", description: "Vector store ID" },
      },
      required: ["vector_store_id"],
    },
  },
  {
    name: "openai_vector_backup",
    description: "Create backup of vector store",
    inputSchema: {
      type: "object",
      properties: {
        vector_store_id: { type: "string", description: "Vector store ID" },
        backup_name: { type: "string", description: "Backup name" },
      },
      required: ["vector_store_id"],
    },
  },

  // ==================== ADVANCED RUNS ====================
  {
    name: "openai_run_retry",
    description: "Retry a failed run",
    inputSchema: {
      type: "object",
      properties: {
        thread_id: { type: "string", description: "Thread ID" },
        run_id: { type: "string", description: "Run ID to retry" },
      },
      required: ["thread_id", "run_id"],
    },
  },
  {
    name: "openai_run_resume",
    description: "Resume a paused run",
    inputSchema: {
      type: "object",
      properties: {
        thread_id: { type: "string", description: "Thread ID" },
        run_id: { type: "string", description: "Run ID to resume" },
      },
      required: ["thread_id", "run_id"],
    },
  },
  {
    name: "openai_run_clone",
    description: "Clone a run with same parameters",
    inputSchema: {
      type: "object",
      properties: {
        thread_id: { type: "string", description: "Thread ID" },
        run_id: { type: "string", description: "Run ID to clone" },
      },
      required: ["thread_id", "run_id"],
    },
  },
  {
    name: "openai_run_analyze",
    description: "Analyze run performance and errors",
    inputSchema: {
      type: "object",
      properties: {
        thread_id: { type: "string", description: "Thread ID" },
        run_id: { type: "string", description: "Run ID" },
      },
      required: ["thread_id", "run_id"],
    },
  },
  {
    name: "openai_run_optimize",
    description: "Get optimization suggestions for run",
    inputSchema: {
      type: "object",
      properties: {
        thread_id: { type: "string", description: "Thread ID" },
        run_id: { type: "string", description: "Run ID" },
      },
      required: ["thread_id", "run_id"],
    },
  },
  {
    name: "openai_run_monitor",
    description: "Monitor run in real-time",
    inputSchema: {
      type: "object",
      properties: {
        thread_id: { type: "string", description: "Thread ID" },
        run_id: { type: "string", description: "Run ID" },
      },
      required: ["thread_id", "run_id"],
    },
  },
  {
    name: "openai_run_export",
    description: "Export run data and results",
    inputSchema: {
      type: "object",
      properties: {
        thread_id: { type: "string", description: "Thread ID" },
        run_id: { type: "string", description: "Run ID" },
        format: { type: "string", enum: ["json", "markdown"], default: "json" },
      },
      required: ["thread_id", "run_id"],
    },
  },
  {
    name: "openai_run_compare",
    description: "Compare two runs",
    inputSchema: {
      type: "object",
      properties: {
        thread_id: { type: "string", description: "Thread ID" },
        run_id_1: { type: "string", description: "First run ID" },
        run_id_2: { type: "string", description: "Second run ID" },
      },
      required: ["thread_id", "run_id_1", "run_id_2"],
    },
  },
];
