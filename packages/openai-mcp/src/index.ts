#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import OpenAI from "openai";
import { CostManager } from "./cost-manager.js";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.argv[2] || "";

if (!OPENAI_API_KEY) {
  console.error("Error: OPENAI_API_KEY is required");
  console.error("Usage: openai-mcp <OPENAI_API_KEY>");
  console.error("Or set OPENAI_API_KEY environment variable");
  process.exit(1);
}

class OpenAIMCP {
  private server: Server;
  private openai: OpenAI;
  private costManager: CostManager;

  constructor() {
    this.openai = new OpenAI({ apiKey: OPENAI_API_KEY });
    this.costManager = new CostManager();

    this.server = new Server(
      {
        name: "@robinsonai/openai-mcp",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
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
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          // Chat & Completions
          case "openai_chat_completion":
            return await this.chatCompletion(args);
          case "openai_chat_completion_stream":
            return await this.chatCompletionStream(args);
          case "openai_chat_with_functions":
            return await this.chatWithFunctions(args);

          // Embeddings
          case "openai_create_embedding":
            return await this.createEmbedding(args);
          case "openai_batch_embeddings":
            return await this.batchEmbeddings(args);

          // Images
          case "openai_generate_image":
            return await this.generateImage(args);
          case "openai_edit_image":
            return await this.editImage(args);
          case "openai_create_image_variation":
            return await this.createImageVariation(args);

          // Audio
          case "openai_text_to_speech":
            return await this.textToSpeech(args);
          case "openai_speech_to_text":
            return await this.speechToText(args);
          case "openai_translate_audio":
            return await this.translateAudio(args);

          // Moderation
          case "openai_moderate_content":
            return await this.moderateContent(args);

          // Models
          case "openai_list_models":
            return await this.listModels(args);
          case "openai_get_model":
            return await this.getModel(args);
          case "openai_delete_model":
            return await this.deleteModel(args);

          // Files
          case "openai_upload_file":
            return await this.uploadFile(args);
          case "openai_list_files":
            return await this.listFiles(args);
          case "openai_retrieve_file":
            return await this.retrieveFile(args);
          case "openai_delete_file":
            return await this.deleteFile(args);
          case "openai_retrieve_file_content":
            return await this.retrieveFileContent(args);

          // Fine-tuning
          case "openai_create_fine_tune":
            return await this.createFineTune(args);
          case "openai_list_fine_tunes":
            return await this.listFineTunes(args);
          case "openai_retrieve_fine_tune":
            return await this.retrieveFineTune(args);
          case "openai_cancel_fine_tune":
            return await this.cancelFineTune(args);
          case "openai_list_fine_tune_events":
            return await this.listFineTuneEvents(args);
          case "openai_list_fine_tune_checkpoints":
            return await this.listFineTuneCheckpoints(args);

          // Batch API
          case "openai_create_batch":
            return await this.createBatch(args);
          case "openai_retrieve_batch":
            return await this.retrieveBatch(args);
          case "openai_cancel_batch":
            return await this.cancelBatch(args);
          case "openai_list_batches":
            return await this.listBatches(args);

          // Assistants
          case "openai_create_assistant":
            return await this.createAssistant(args);
          case "openai_list_assistants":
            return await this.listAssistants(args);
          case "openai_retrieve_assistant":
            return await this.retrieveAssistant(args);
          case "openai_modify_assistant":
            return await this.modifyAssistant(args);
          case "openai_delete_assistant":
            return await this.deleteAssistant(args);

          // Threads
          case "openai_create_thread":
            return await this.createThread(args);
          case "openai_retrieve_thread":
            return await this.retrieveThread(args);
          case "openai_modify_thread":
            return await this.modifyThread(args);
          case "openai_delete_thread":
            return await this.deleteThread(args);

          // Messages
          case "openai_create_message":
            return await this.createMessage(args);
          case "openai_list_messages":
            return await this.listMessages(args);
          case "openai_retrieve_message":
            return await this.retrieveMessage(args);
          case "openai_modify_message":
            return await this.modifyMessage(args);
          case "openai_delete_message":
            return await this.deleteMessage(args);

          // Runs
          case "openai_create_run":
            return await this.createRun(args);
          case "openai_create_thread_and_run":
            return await this.createThreadAndRun(args);
          case "openai_list_runs":
            return await this.listRuns(args);
          case "openai_retrieve_run":
            return await this.retrieveRun(args);
          case "openai_modify_run":
            return await this.modifyRun(args);
          case "openai_cancel_run":
            return await this.cancelRun(args);
          case "openai_submit_tool_outputs":
            return await this.submitToolOutputs(args);
          case "openai_list_run_steps":
            return await this.listRunSteps(args);
          case "openai_retrieve_run_step":
            return await this.retrieveRunStep(args);

          // Vector Stores
          case "openai_create_vector_store":
            return await this.createVectorStore(args);
          case "openai_list_vector_stores":
            return await this.listVectorStores(args);
          case "openai_retrieve_vector_store":
            return await this.retrieveVectorStore(args);
          case "openai_modify_vector_store":
            return await this.modifyVectorStore(args);
          case "openai_delete_vector_store":
            return await this.deleteVectorStore(args);
          case "openai_create_vector_store_file":
            return await this.createVectorStoreFile(args);
          case "openai_list_vector_store_files":
            return await this.listVectorStoreFiles(args);
          case "openai_retrieve_vector_store_file":
            return await this.retrieveVectorStoreFile(args);
          case "openai_delete_vector_store_file":
            return await this.deleteVectorStoreFile(args);
          case "openai_create_vector_store_file_batch":
            return await this.createVectorStoreFileBatch(args);
          case "openai_retrieve_vector_store_file_batch":
            return await this.retrieveVectorStoreFileBatch(args);
          case "openai_cancel_vector_store_file_batch":
            return await this.cancelVectorStoreFileBatch(args);

          // Cost Management
          case "openai_estimate_cost":
            return await this.estimateCost(args);
          case "openai_get_budget_status":
            return await this.getBudgetStatus(args);

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error.message}`,
            },
          ],
        };
      }
    });
  }

  // ==================== IMPLEMENTATION METHODS ====================

  private formatResponse(data: any): { content: Array<{ type: string; text: string }> } {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }

  // Chat Completions
  private async chatCompletion(args: any) {
    const { model = "gpt-4-turbo", messages, temperature, max_tokens, top_p, frequency_penalty, presence_penalty } = args;

    try {
      // Estimate cost
      const inputText = messages.map((m: any) => m.content).join("\n");
      const estimate = this.costManager.estimateChatCost(model, inputText, max_tokens || 1000);

      // Check if approval needed
      if (estimate.budget_check.requires_approval) {
        return this.formatResponse({
          requires_approval: true,
          approval_type: estimate.budget_check.requires_double_approval ? "double" : "standard",
          cost_estimate: estimate,
          message: "This operation requires approval. Please review the cost estimate and approve to proceed.",
          instructions: estimate.budget_check.requires_double_approval
            ? "This requires DOUBLE APPROVAL. You'll be asked 'Are you sure?' after initial approval."
            : "Please approve this operation to proceed.",
        });
      }

      // Make API call
      const response = await this.openai.chat.completions.create({
        model,
        messages,
        temperature,
        max_tokens,
        top_p,
        frequency_penalty,
        presence_penalty,
      });

      // Calculate actual cost
      const actualCost =
        ((response.usage?.prompt_tokens || 0) / 1000) * (this.costManager as any).PRICING[model]?.input_per_1k +
        ((response.usage?.completion_tokens || 0) / 1000) * (this.costManager as any).PRICING[model]?.output_per_1k;

      // Record cost
      this.costManager.recordCost(actualCost, model, "chat_completion", {
        tokens: response.usage,
      });

      return this.formatResponse({
        response: response.choices[0].message,
        usage: response.usage,
        cost_info: {
          estimated_cost: estimate.estimated_cost_usd,
          actual_cost: actualCost,
          tokens: response.usage,
          daily_total: this.costManager.getDailySpent(),
          monthly_total: this.costManager.getMonthlySpent(),
        },
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async chatCompletionStream(args: any) {
    return this.formatResponse({
      error: "Streaming not yet supported in MCP. Use standard chat_completion instead.",
    });
  }

  private async chatWithFunctions(args: any) {
    const { model = "gpt-4-turbo", messages, functions, function_call, temperature, max_tokens } = args;

    try {
      // Estimate cost
      const inputText = messages.map((m: any) => m.content).join("\n");
      const estimate = this.costManager.estimateChatCost(model, inputText, max_tokens || 1000);

      // Check if approval needed
      if (estimate.budget_check.requires_approval) {
        return this.formatResponse({
          requires_approval: true,
          cost_estimate: estimate,
        });
      }

      // Make API call with functions
      const response = await this.openai.chat.completions.create({
        model,
        messages,
        functions,
        function_call,
        temperature,
        max_tokens,
      });

      // Calculate and record cost
      const actualCost =
        ((response.usage?.prompt_tokens || 0) / 1000) * (this.costManager as any).PRICING[model]?.input_per_1k +
        ((response.usage?.completion_tokens || 0) / 1000) * (this.costManager as any).PRICING[model]?.output_per_1k;

      this.costManager.recordCost(actualCost, model, "chat_with_functions", {
        tokens: response.usage,
      });

      return this.formatResponse({
        response: response.choices[0].message,
        usage: response.usage,
        cost_info: {
          actual_cost: actualCost,
          daily_total: this.costManager.getDailySpent(),
        },
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  // Embeddings
  private async createEmbedding(args: any) {
    const { model = "text-embedding-3-small", input, encoding_format, dimensions } = args;

    try {
      // Estimate cost
      const texts = Array.isArray(input) ? input : [input];
      const estimate = this.costManager.estimateEmbeddingCost(model, texts);

      // Check if approval needed (unlikely for embeddings, but possible for large batches)
      if (estimate.budget_check.requires_approval) {
        return this.formatResponse({
          requires_approval: true,
          cost_estimate: estimate,
        });
      }

      // Make API call
      const response = await this.openai.embeddings.create({
        model,
        input,
        encoding_format,
        dimensions,
      });

      // Calculate actual cost
      const totalTokens = response.usage.total_tokens;
      const actualCost = (totalTokens / 1000) * (this.costManager as any).PRICING[model]?.per_1k;

      // Record cost
      this.costManager.recordCost(actualCost, model, "create_embedding", {
        tokens: response.usage.total_tokens,
        count: response.data.length,
      });

      return this.formatResponse({
        embeddings: response.data,
        usage: response.usage,
        cost_info: {
          estimated_cost: estimate.estimated_cost_usd,
          actual_cost: actualCost,
          tokens: response.usage.total_tokens,
          daily_total: this.costManager.getDailySpent(),
        },
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async batchEmbeddings(args: any) {
    const { model = "text-embedding-3-small", inputs } = args;

    try {
      // Estimate cost for batch
      const estimate = this.costManager.estimateEmbeddingCost(model, inputs);

      // Check if approval needed
      if (estimate.budget_check.requires_approval) {
        return this.formatResponse({
          requires_approval: true,
          cost_estimate: estimate,
          message: `Batch embedding ${inputs.length} texts will cost approximately $${estimate.estimated_cost_usd.toFixed(4)}`,
        });
      }

      // Make API call
      const response = await this.openai.embeddings.create({
        model,
        input: inputs,
      });

      // Calculate actual cost
      const totalTokens = response.usage.total_tokens;
      const actualCost = (totalTokens / 1000) * (this.costManager as any).PRICING[model]?.per_1k;

      // Record cost
      this.costManager.recordCost(actualCost, model, "batch_embeddings", {
        tokens: response.usage.total_tokens,
        count: response.data.length,
      });

      return this.formatResponse({
        embeddings: response.data,
        usage: response.usage,
        cost_info: {
          estimated_cost: estimate.estimated_cost_usd,
          actual_cost: actualCost,
          tokens: response.usage.total_tokens,
          count: response.data.length,
          daily_total: this.costManager.getDailySpent(),
        },
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  // Images
  private async generateImage(args: any) {
    const { model = "dall-e-3", prompt, n = 1, size = "1024x1024", quality = "standard", response_format } = args;

    try {
      // Estimate cost
      const estimate = this.costManager.estimateImageCost(model, size, quality, n);

      // Check if approval needed
      if (estimate.budget_check.requires_approval) {
        return this.formatResponse({
          requires_approval: true,
          approval_type: estimate.budget_check.requires_double_approval ? "double" : "standard",
          cost_estimate: estimate,
          message: `Generating ${n} image(s) with ${model} will cost approximately $${estimate.estimated_cost_usd.toFixed(4)}`,
        });
      }

      // Make API call
      const response = await this.openai.images.generate({
        model,
        prompt,
        n,
        size: size as any,
        quality: quality as any,
        response_format,
      });

      // Record cost
      this.costManager.recordCost(estimate.estimated_cost_usd, model, "generate_image", {
        count: n,
        size,
        quality,
      });

      return this.formatResponse({
        images: response.data,
        cost_info: {
          estimated_cost: estimate.estimated_cost_usd,
          actual_cost: estimate.estimated_cost_usd,
          count: n,
          daily_total: this.costManager.getDailySpent(),
          monthly_total: this.costManager.getMonthlySpent(),
        },
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async editImage(args: any) {
    return this.formatResponse({
      message: "Image editing requires file upload which is not yet supported in this MCP implementation",
      note: "Use the OpenAI API directly for image editing"
    });
  }

  private async createImageVariation(args: any) {
    return this.formatResponse({
      message: "Image variations require file upload which is not yet supported in this MCP implementation",
      note: "Use the OpenAI API directly for image variations"
    });
  }

  // Audio
  private async textToSpeech(args: any) {
    const { model = "tts-1", input, voice = "alloy", response_format = "mp3", speed = 1.0 } = args;

    try {
      // Estimate cost (TTS is $0.015 per 1K characters)
      const charCount = input.length;
      const estimatedCost = (charCount / 1000) * 0.015;

      // Check if approval needed
      if (estimatedCost > parseFloat(process.env.OPENAI_APPROVAL_THRESHOLD || "0.50")) {
        return this.formatResponse({
          requires_approval: true,
          estimated_cost: estimatedCost,
          character_count: charCount,
          message: `Converting ${charCount} characters to speech will cost approximately $${estimatedCost.toFixed(4)}`,
        });
      }

      // Make API call
      const response = await this.openai.audio.speech.create({
        model,
        input,
        voice: voice as any,
        response_format: response_format as any,
        speed,
      });

      // Get audio buffer
      const buffer = Buffer.from(await response.arrayBuffer());
      const base64Audio = buffer.toString('base64');

      // Record cost
      this.costManager.recordCost(estimatedCost, model, "text_to_speech", {
        characters: charCount,
      });

      return this.formatResponse({
        audio_base64: base64Audio,
        format: response_format,
        cost_info: {
          actual_cost: estimatedCost,
          characters: charCount,
          daily_total: this.costManager.getDailySpent(),
        },
        note: "Audio returned as base64. Decode and save to file to use.",
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async speechToText(args: any) {
    return this.formatResponse({
      message: "Speech-to-text requires audio file upload which is not yet supported in this MCP implementation",
      note: "Use the OpenAI API directly for Whisper transcription"
    });
  }

  private async translateAudio(args: any) {
    return this.formatResponse({
      message: "Audio translation requires audio file upload which is not yet supported in this MCP implementation",
      note: "Use the OpenAI API directly for Whisper translation"
    });
  }

  // Moderation
  private async moderateContent(args: any) {
    const { input } = args;

    try {
      // Moderation API is free, no cost estimation needed
      const response = await this.openai.moderations.create({
        input,
      });

      return this.formatResponse({
        results: response.results,
        flagged: response.results[0].flagged,
        categories: response.results[0].categories,
        category_scores: response.results[0].category_scores,
        note: "Moderation API is free to use",
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  // Models
  private async listModels(args: any) {
    try {
      const response = await this.openai.models.list();
      return this.formatResponse({
        models: response.data,
        count: response.data.length,
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async getModel(args: any) {
    const { model } = args;

    try {
      const response = await this.openai.models.retrieve(model);
      return this.formatResponse(response);
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async deleteModel(args: any) {
    const { model } = args;

    try {
      const response = await this.openai.models.del(model);
      return this.formatResponse({
        deleted: response.deleted,
        model: response.id,
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  // Files
  private async uploadFile(args: any) {
    return this.formatResponse({
      message: "File upload requires file system access which is not yet supported in this MCP implementation",
      note: "Use the OpenAI API directly or upload files through the OpenAI dashboard"
    });
  }

  private async listFiles(args: any) {
    const { purpose } = args;

    try {
      const response = await this.openai.files.list({ purpose });
      return this.formatResponse({
        files: response.data,
        count: response.data.length,
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async retrieveFile(args: any) {
    const { file_id } = args;

    try {
      const response = await this.openai.files.retrieve(file_id);
      return this.formatResponse(response);
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async deleteFile(args: any) {
    const { file_id } = args;

    try {
      const response = await this.openai.files.del(file_id);
      return this.formatResponse({
        deleted: response.deleted,
        file_id: response.id,
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async retrieveFileContent(args: any) {
    const { file_id } = args;

    try {
      const response = await this.openai.files.content(file_id);
      const content = await response.text();
      return this.formatResponse({
        file_id,
        content,
        size: content.length,
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  // Fine-tuning
  private async createFineTune(args: any) {
    const { training_file, model = "gpt-3.5-turbo", validation_file, hyperparameters, suffix } = args;

    try {
      const response = await this.openai.fineTuning.jobs.create({
        training_file,
        model,
        validation_file,
        hyperparameters,
        suffix,
      });

      return this.formatResponse(response);
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async listFineTunes(args: any) {
    const { limit } = args;

    try {
      const response = await this.openai.fineTuning.jobs.list({ limit });
      return this.formatResponse({
        jobs: response.data,
        count: response.data.length,
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async retrieveFineTune(args: any) {
    const { fine_tune_id } = args;

    try {
      const response = await this.openai.fineTuning.jobs.retrieve(fine_tune_id);
      return this.formatResponse(response);
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async cancelFineTune(args: any) {
    const { fine_tune_id } = args;

    try {
      const response = await this.openai.fineTuning.jobs.cancel(fine_tune_id);
      return this.formatResponse(response);
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async listFineTuneEvents(args: any) {
    const { fine_tune_id } = args;

    try {
      const response = await this.openai.fineTuning.jobs.listEvents(fine_tune_id);
      return this.formatResponse({
        events: response.data,
        count: response.data.length,
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async listFineTuneCheckpoints(args: any) {
    const { fine_tune_id } = args;

    try {
      const response = await this.openai.fineTuning.jobs.checkpoints.list(fine_tune_id);
      return this.formatResponse({
        checkpoints: response.data,
        count: response.data.length,
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  // Batch API
  private async createBatch(args: any) {
    const { input_file_id, endpoint, completion_window = "24h", metadata } = args;

    try {
      const response = await this.openai.batches.create({
        input_file_id,
        endpoint,
        completion_window,
        metadata,
      });

      return this.formatResponse({
        ...response,
        note: "Batch API provides 50% cost savings for async processing!",
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async retrieveBatch(args: any) {
    const { batch_id } = args;

    try {
      const response = await this.openai.batches.retrieve(batch_id);
      return this.formatResponse(response);
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async cancelBatch(args: any) {
    const { batch_id } = args;

    try {
      const response = await this.openai.batches.cancel(batch_id);
      return this.formatResponse(response);
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async listBatches(args: any) {
    const { limit } = args;

    try {
      const response = await this.openai.batches.list({ limit });
      return this.formatResponse({
        batches: response.data,
        count: response.data.length,
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  // Assistants
  private async createAssistant(args: any) {
    const { name, model = "gpt-4-turbo", instructions, tools, tool_resources, metadata } = args;

    try {
      const response = await this.openai.beta.assistants.create({
        name,
        model,
        instructions,
        tools,
        tool_resources,
        metadata,
      });

      return this.formatResponse(response);
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async listAssistants(args: any) {
    try {
      const response = await this.openai.beta.assistants.list(args);
      return this.formatResponse(response);
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async retrieveAssistant(args: any) {
    try {
      const response = await this.openai.beta.assistants.retrieve(args.assistant_id);
      return this.formatResponse(response);
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async modifyAssistant(args: any) {
    const { assistant_id, ...updates } = args;
    try {
      const response = await this.openai.beta.assistants.update(assistant_id, updates);
      return this.formatResponse(response);
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async deleteAssistant(args: any) {
    try {
      const response = await this.openai.beta.assistants.del(args.assistant_id);
      return this.formatResponse(response);
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  // Threads
  private async createThread(args: any) {
    try {
      const response = await this.openai.beta.threads.create(args);
      return this.formatResponse(response);
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async retrieveThread(args: any) {
    try {
      const response = await this.openai.beta.threads.retrieve(args.thread_id);
      return this.formatResponse(response);
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async modifyThread(args: any) {
    const { thread_id, ...updates } = args;
    try {
      const response = await this.openai.beta.threads.update(thread_id, updates);
      return this.formatResponse(response);
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async deleteThread(args: any) {
    try {
      const response = await this.openai.beta.threads.del(args.thread_id);
      return this.formatResponse(response);
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  // Messages
  private async createMessage(args: any) {
    const { thread_id, ...messageData } = args;
    try {
      const response = await this.openai.beta.threads.messages.create(thread_id, messageData);
      return this.formatResponse(response);
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async listMessages(args: any) {
    const { thread_id, ...params } = args;
    try {
      const response = await this.openai.beta.threads.messages.list(thread_id, params);
      return this.formatResponse(response);
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async retrieveMessage(args: any) {
    try {
      const response = await this.openai.beta.threads.messages.retrieve(args.thread_id, args.message_id);
      return this.formatResponse(response);
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async modifyMessage(args: any) {
    const { thread_id, message_id, ...updates } = args;
    try {
      const response = await this.openai.beta.threads.messages.update(thread_id, message_id, updates);
      return this.formatResponse(response);
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async deleteMessage(args: any) {
    return this.formatResponse({ message: "Not yet implemented" });
  }

  // Runs
  private async createRun(args: any) {
    const { thread_id, ...runData } = args;
    try {
      const response = await this.openai.beta.threads.runs.create(thread_id, runData);
      return this.formatResponse(response);
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async createThreadAndRun(args: any) {
    try {
      const response = await this.openai.beta.threads.createAndRun(args);
      return this.formatResponse(response);
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async listRuns(args: any) {
    const { thread_id, ...params } = args;
    try {
      const response = await this.openai.beta.threads.runs.list(thread_id, params);
      return this.formatResponse(response);
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async retrieveRun(args: any) {
    try {
      const response = await this.openai.beta.threads.runs.retrieve(args.thread_id, args.run_id);
      return this.formatResponse(response);
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async modifyRun(args: any) {
    const { thread_id, run_id, ...updates } = args;
    try {
      const response = await this.openai.beta.threads.runs.update(thread_id, run_id, updates);
      return this.formatResponse(response);
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async cancelRun(args: any) {
    try {
      const response = await this.openai.beta.threads.runs.cancel(args.thread_id, args.run_id);
      return this.formatResponse(response);
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async submitToolOutputs(args: any) {
    const { thread_id, run_id, tool_outputs } = args;
    try {
      const response = await this.openai.beta.threads.runs.submitToolOutputs(thread_id, run_id, { tool_outputs });
      return this.formatResponse(response);
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async listRunSteps(args: any) {
    const { thread_id, run_id, ...params } = args;
    try {
      const response = await this.openai.beta.threads.runs.steps.list(thread_id, run_id, params);
      return this.formatResponse(response);
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async retrieveRunStep(args: any) {
    try {
      const response = await this.openai.beta.threads.runs.steps.retrieve(args.thread_id, args.run_id, args.step_id);
      return this.formatResponse(response);
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  // Vector Stores (RAG) - Stub implementations for now
  private async createVectorStore(args: any) {
    return this.formatResponse({
      message: "Vector Stores API not yet available in OpenAI SDK v4.73.0",
      note: "This feature will be implemented when the SDK is updated"
    });
  }

  private async listVectorStores(args: any) {
    return this.formatResponse({ message: "Not yet implemented - awaiting SDK update" });
  }

  private async retrieveVectorStore(args: any) {
    return this.formatResponse({ message: "Not yet implemented - awaiting SDK update" });
  }

  private async modifyVectorStore(args: any) {
    return this.formatResponse({ message: "Not yet implemented - awaiting SDK update" });
  }

  private async deleteVectorStore(args: any) {
    return this.formatResponse({ message: "Not yet implemented - awaiting SDK update" });
  }

  private async createVectorStoreFile(args: any) {
    return this.formatResponse({ message: "Not yet implemented - awaiting SDK update" });
  }

  private async listVectorStoreFiles(args: any) {
    return this.formatResponse({ message: "Not yet implemented - awaiting SDK update" });
  }

  private async retrieveVectorStoreFile(args: any) {
    return this.formatResponse({ message: "Not yet implemented - awaiting SDK update" });
  }

  private async deleteVectorStoreFile(args: any) {
    return this.formatResponse({ message: "Not yet implemented - awaiting SDK update" });
  }

  private async createVectorStoreFileBatch(args: any) {
    return this.formatResponse({ message: "Not yet implemented - awaiting SDK update" });
  }

  private async retrieveVectorStoreFileBatch(args: any) {
    return this.formatResponse({ message: "Not yet implemented - awaiting SDK update" });
  }

  private async cancelVectorStoreFileBatch(args: any) {
    return this.formatResponse({ message: "Not yet implemented - awaiting SDK update" });
  }

  // Cost Management
  private async estimateCost(args: any) {
    const { operation, model, input_text, max_tokens, image_count, image_size, image_quality } = args;

    try {
      let estimate;

      switch (operation) {
        case "chat":
          estimate = this.costManager.estimateChatCost(model, input_text || "", max_tokens || 1000);
          break;
        case "embedding":
          estimate = this.costManager.estimateEmbeddingCost(model, [input_text || ""]);
          break;
        case "image":
          estimate = this.costManager.estimateImageCost(
            model,
            image_size || "1024x1024",
            image_quality || "standard",
            image_count || 1
          );
          break;
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }

      return this.formatResponse(estimate);
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async getBudgetStatus(args: any) {
    const status = this.costManager.getBudgetStatus();
    return this.formatResponse(status);
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("OpenAI MCP server running on stdio");
  }
}

const server = new OpenAIMCP();
server.run().catch(console.error);
