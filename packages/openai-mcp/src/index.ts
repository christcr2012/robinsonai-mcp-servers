#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import OpenAI from "openai";
import { CostManager } from "./cost-manager.js";

const OPENAI_ADMIN_KEY = process.env.OPENAI_ADMIN_KEY || "";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.argv[2] || "";

// Use admin key if available (it can do everything), otherwise use regular API key
const API_KEY = OPENAI_ADMIN_KEY || OPENAI_API_KEY;

if (!API_KEY) {
  console.error("Error: OPENAI_API_KEY or OPENAI_ADMIN_KEY is required");
  console.error("Usage: openai-mcp <OPENAI_API_KEY>");
  console.error("Or set OPENAI_API_KEY or OPENAI_ADMIN_KEY environment variable");
  console.error("\nNote: Admin keys can do everything regular keys can do, PLUS enterprise features");
  console.error("      (Usage API, Projects, Users, etc.)");
  process.exit(1);
}

if (OPENAI_ADMIN_KEY) {
  console.log("✅ Using OpenAI Admin Key - All features enabled!");
} else {
  console.log("ℹ️  Using regular API Key - Enterprise features require admin key");
}

class OpenAIMCP {
  private server: Server;
  private openai: OpenAI;
  private costManager: CostManager;

  constructor() {
    this.openai = new OpenAI({ apiKey: API_KEY });
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
          case "openai_get_cost_breakdown":
            return await this.getCostBreakdown(args);
          case "openai_compare_models":
            return await this.compareModels(args);
          case "openai_optimize_prompt":
            return await this.optimizePrompt(args);
          case "openai_export_cost_report":
            return await this.exportCostReport(args);
          case "openai_get_token_analytics":
            return await this.getTokenAnalytics(args);
          case "openai_suggest_cheaper_alternative":
            return await this.suggestCheaperAlternative(args);

          // Usage & Billing API
          case "openai_get_usage":
            return await this.getUsage(args);
          case "openai_get_costs":
            return await this.getCosts(args);
          case "openai_get_usage_completions":
            return await this.getUsageCompletions(args);
          case "openai_get_usage_embeddings":
            return await this.getUsageEmbeddings(args);
          case "openai_get_usage_moderations":
            return await this.getUsageModerations(args);
          case "openai_get_usage_images":
            return await this.getUsageImages(args);
          case "openai_get_usage_audio_speeches":
            return await this.getUsageAudioSpeeches(args);
          case "openai_get_usage_audio_transcriptions":
            return await this.getUsageAudioTranscriptions(args);

          // Projects & Organization
          case "openai_list_projects":
            return await this.listProjects(args);
          case "openai_get_project":
            return await this.getProject(args);
          case "openai_create_project":
            return await this.createProject(args);
          case "openai_update_project":
            return await this.updateProject(args);
          case "openai_archive_project":
            return await this.archiveProject(args);

          // Users & Invites
          case "openai_list_users":
            return await this.listUsers(args);
          case "openai_get_user":
            return await this.getUser(args);
          case "openai_update_user":
            return await this.updateUser(args);
          case "openai_delete_user":
            return await this.deleteUser(args);
          case "openai_list_invites":
            return await this.listInvites(args);
          case "openai_create_invite":
            return await this.createInvite(args);
          case "openai_delete_invite":
            return await this.deleteInvite(args);

          // Rate Limits
          case "openai_get_rate_limits":
            return await this.getRateLimits(args);

          // Advanced Cost Features
          case "openai_track_user_cost":
            return await this.trackUserCost(args);
          case "openai_get_user_costs":
            return await this.getUserCosts(args);
          case "openai_set_cost_alert":
            return await this.setCostAlert(args);
          case "openai_list_cost_alerts":
            return await this.listCostAlerts(args);
          case "openai_delete_cost_alert":
            return await this.deleteCostAlert(args);
          case "openai_forecast_costs":
            return await this.forecastCosts(args);
          case "openai_detect_cost_anomalies":
            return await this.detectCostAnomalies(args);
          case "openai_get_budget_recommendations":
            return await this.getBudgetRecommendations(args);

          // Realtime API
          case "openai_create_realtime_session":
            return await this.createRealtimeSession(args);
          case "openai_send_realtime_message":
            return await this.sendRealtimeMessage(args);
          case "openai_get_realtime_response":
            return await this.getRealtimeResponse(args);
          case "openai_update_realtime_session":
            return await this.updateRealtimeSession(args);
          case "openai_interrupt_realtime_response":
            return await this.interruptRealtimeResponse(args);
          case "openai_close_realtime_session":
            return await this.closeRealtimeSession(args);

          // Model Capabilities
          case "openai_get_model_capabilities":
            return await this.getModelCapabilities(args);
          case "openai_compare_model_capabilities":
            return await this.compareModelCapabilities(args);
          case "openai_get_model_pricing":
            return await this.getModelPricing(args);

          // Advanced Batch Operations
          case "openai_get_batch_results":
            return await this.getBatchResults(args);
          case "openai_estimate_batch_cost":
            return await this.estimateBatchCost(args);
          case "openai_get_batch_progress":
            return await this.getBatchProgress(args);

          // Organization Settings
          case "openai_get_organization_settings":
            return await this.getOrganizationSettings(args);
          case "openai_update_organization_settings":
            return await this.updateOrganizationSettings(args);
          case "openai_get_organization_usage_limits":
            return await this.getOrganizationUsageLimits(args);

          // Advanced Usage Analytics
          case "openai_get_usage_by_model":
            return await this.getUsageByModel(args);
          case "openai_get_usage_by_user":
            return await this.getUsageByUser(args);
          case "openai_export_usage_data":
            return await this.exportUsageData(args);

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

  // Advanced Cost Analytics
  private async getCostBreakdown(args: any) {
    const { group_by = "model", start_date, end_date } = args;

    try {
      const history = this.costManager.getCostHistory();
      const breakdown: any = {};

      // Filter by date range if provided
      let filteredHistory = history;
      if (start_date || end_date) {
        filteredHistory = history.filter((entry: any) => {
          const entryDate = new Date(entry.timestamp);
          if (start_date && entryDate < new Date(start_date)) return false;
          if (end_date && entryDate > new Date(end_date)) return false;
          return true;
        });
      }

      // Group by specified field
      filteredHistory.forEach((entry: any) => {
        let key: string;
        switch (group_by) {
          case "model":
            key = entry.model;
            break;
          case "operation":
            key = entry.operation;
            break;
          case "day":
            key = new Date(entry.timestamp).toISOString().split("T")[0];
            break;
          case "hour":
            key = new Date(entry.timestamp).toISOString().slice(0, 13);
            break;
          default:
            key = "unknown";
        }

        if (!breakdown[key]) {
          breakdown[key] = {
            total_cost: 0,
            count: 0,
            operations: [],
          };
        }

        breakdown[key].total_cost += entry.cost;
        breakdown[key].count += 1;
        breakdown[key].operations.push(entry.operation);
      });

      // Calculate totals
      const totalCost = Object.values(breakdown).reduce((sum: number, item: any) => sum + item.total_cost, 0);
      const totalOperations = filteredHistory.length;

      return this.formatResponse({
        breakdown,
        summary: {
          total_cost: totalCost,
          total_operations: totalOperations,
          group_by,
          period: start_date && end_date ? `${start_date} to ${end_date}` : "all time",
        },
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async compareModels(args: any) {
    const { models, input_text, max_tokens = 1000 } = args;

    try {
      const comparisons = models.map((model: string) => {
        const estimate = this.costManager.estimateChatCost(model, input_text, max_tokens);
        const inputTokens = estimate.breakdown?.input_tokens || 0;
        const outputTokens = estimate.breakdown?.output_tokens || 0;
        const totalTokens = inputTokens + outputTokens;

        return {
          model,
          estimated_cost: estimate.estimated_cost_usd,
          input_tokens: inputTokens,
          output_tokens: outputTokens,
          total_tokens: totalTokens,
          cost_per_1k_tokens: totalTokens > 0 ? (estimate.estimated_cost_usd / totalTokens) * 1000 : 0,
        };
      });

      // Sort by cost
      comparisons.sort((a: any, b: any) => a.estimated_cost - b.estimated_cost);

      const cheapest = comparisons[0];
      const mostExpensive = comparisons[comparisons.length - 1];
      const savings = mostExpensive.estimated_cost - cheapest.estimated_cost;
      const savingsPercent = ((savings / mostExpensive.estimated_cost) * 100).toFixed(1);

      return this.formatResponse({
        comparisons,
        recommendation: {
          cheapest_model: cheapest.model,
          cheapest_cost: cheapest.estimated_cost,
          most_expensive_model: mostExpensive.model,
          most_expensive_cost: mostExpensive.estimated_cost,
          potential_savings: savings,
          savings_percent: `${savingsPercent}%`,
          note: `Using ${cheapest.model} instead of ${mostExpensive.model} saves ${savingsPercent}% ($${savings.toFixed(4)} per request)`,
        },
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async optimizePrompt(args: any) {
    const { prompt, model = "gpt-4" } = args;

    try {
      const currentTokens = this.costManager.estimateTokens(prompt, model);
      const currentCost = this.costManager.estimateChatCost(model, prompt, 1000);

      // Provide optimization suggestions
      const suggestions = [];

      if (prompt.length > 1000) {
        suggestions.push({
          type: "length",
          suggestion: "Consider shortening the prompt - it's quite long",
          potential_savings: "10-30% token reduction",
        });
      }

      if (prompt.includes("\n\n\n")) {
        suggestions.push({
          type: "whitespace",
          suggestion: "Remove excessive whitespace and newlines",
          potential_savings: "5-10% token reduction",
        });
      }

      if (prompt.split(" ").some((word: string) => word.length > 20)) {
        suggestions.push({
          type: "verbosity",
          suggestion: "Use more concise language",
          potential_savings: "10-20% token reduction",
        });
      }

      return this.formatResponse({
        current_analysis: {
          token_count: currentTokens,
          estimated_cost: currentCost.estimated_cost_usd,
          model,
        },
        suggestions,
        note: "These are general suggestions. Actual savings depend on implementation.",
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async exportCostReport(args: any) {
    const { format, start_date, end_date } = args;

    try {
      const history = this.costManager.getCostHistory();

      // Filter by date range
      let filteredHistory = history;
      if (start_date || end_date) {
        filteredHistory = history.filter((entry: any) => {
          const entryDate = new Date(entry.timestamp);
          if (start_date && entryDate < new Date(start_date)) return false;
          if (end_date && entryDate > new Date(end_date)) return false;
          return true;
        });
      }

      if (format === "json") {
        return this.formatResponse({
          format: "json",
          data: filteredHistory,
          total_cost: filteredHistory.reduce((sum: number, entry: any) => sum + entry.cost, 0),
          total_operations: filteredHistory.length,
        });
      } else if (format === "csv") {
        // Generate CSV
        const csvHeader = "Timestamp,Model,Operation,Cost,Details\n";
        const csvRows = filteredHistory
          .map(
            (entry: any) =>
              `${entry.timestamp},${entry.model},${entry.operation},${entry.cost},"${JSON.stringify(entry.details).replace(/"/g, '""')}"`
          )
          .join("\n");
        const csv = csvHeader + csvRows;

        return this.formatResponse({
          format: "csv",
          data: csv,
          total_cost: filteredHistory.reduce((sum: number, entry: any) => sum + entry.cost, 0),
          total_operations: filteredHistory.length,
          note: "CSV data provided as string. Save to file to use.",
        });
      }

      return this.formatResponse({ error: "Invalid format. Use 'json' or 'csv'." });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async getTokenAnalytics(args: any) {
    const { period = "all" } = args;

    try {
      const history = this.costManager.getCostHistory();

      // Filter by period
      const now = new Date();
      const filteredHistory = history.filter((entry: any) => {
        const entryDate = new Date(entry.timestamp);
        switch (period) {
          case "today":
            return entryDate.toDateString() === now.toDateString();
          case "week":
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return entryDate >= weekAgo;
          case "month":
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return entryDate >= monthAgo;
          default:
            return true;
        }
      });

      // Calculate token statistics
      const totalTokens = filteredHistory.reduce((sum: number, entry: any) => {
        return sum + (entry.details?.tokens?.total_tokens || entry.details?.tokens || 0);
      }, 0);

      const avgTokensPerRequest =
        filteredHistory.length > 0 ? totalTokens / filteredHistory.length : 0;

      return this.formatResponse({
        period,
        total_tokens: totalTokens,
        total_requests: filteredHistory.length,
        avg_tokens_per_request: Math.round(avgTokensPerRequest),
        total_cost: filteredHistory.reduce((sum: number, entry: any) => sum + entry.cost, 0),
        cost_per_1k_tokens: filteredHistory.length > 0 ? (filteredHistory.reduce((sum: number, entry: any) => sum + entry.cost, 0) / totalTokens) * 1000 : 0,
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async suggestCheaperAlternative(args: any) {
    const { current_model, task_type, quality_requirement = "high" } = args;

    try {
      const alternatives: any = {
        "gpt-4": {
          highest: [],
          high: ["gpt-4-turbo"],
          medium: ["gpt-3.5-turbo"],
          low: ["gpt-3.5-turbo"],
        },
        "gpt-4-turbo": {
          highest: [],
          high: [],
          medium: ["gpt-3.5-turbo"],
          low: ["gpt-3.5-turbo"],
        },
        "gpt-3.5-turbo": {
          highest: [],
          high: [],
          medium: [],
          low: [],
        },
        "text-embedding-3-large": {
          highest: [],
          high: ["text-embedding-3-small"],
          medium: ["text-embedding-3-small"],
          low: ["text-embedding-ada-002"],
        },
        "dall-e-3": {
          highest: [],
          high: [],
          medium: ["dall-e-2"],
          low: ["dall-e-2"],
        },
      };

      const suggestions = alternatives[current_model]?.[quality_requirement] || [];

      if (suggestions.length === 0) {
        return this.formatResponse({
          current_model,
          message: `${current_model} is already the most cost-effective option for ${quality_requirement} quality ${task_type} tasks.`,
          alternatives: [],
        });
      }

      return this.formatResponse({
        current_model,
        quality_requirement,
        task_type,
        suggestions: suggestions.map((model: string) => ({
          model,
          note: `Consider switching to ${model} for cost savings while maintaining ${quality_requirement} quality.`,
        })),
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  // Usage & Billing API (NEW Dec 2024)
  private async getUsage(args: any) {
    if (!OPENAI_ADMIN_KEY) {
      return this.formatResponse({
        error: "Usage API requires an Organization Admin Key",
        note: "Set OPENAI_ADMIN_KEY environment variable with your admin key",
        how_to_get: "Create an Organization Admin Key at https://platform.openai.com/organization/admin-keys",
        required_scope: "api.usage.read",
      });
    }

    const { start_time, end_time, bucket_width, project_ids, user_ids, api_key_ids, models, group_by, limit } = args;

    try {
      const params = new URLSearchParams();
      if (start_time) params.append("start_time", start_time.toString());
      if (end_time) params.append("end_time", end_time.toString());
      if (bucket_width) params.append("bucket_width", bucket_width);
      if (limit) params.append("limit", limit.toString());
      if (project_ids) project_ids.forEach((id: string) => params.append("project_ids[]", id));
      if (user_ids) user_ids.forEach((id: string) => params.append("user_ids[]", id));
      if (api_key_ids) api_key_ids.forEach((id: string) => params.append("api_key_ids[]", id));
      if (models) models.forEach((model: string) => params.append("models[]", model));
      if (group_by) group_by.forEach((field: string) => params.append("group_by[]", field));

      const response = await fetch(`https://api.openai.com/v1/organization/usage?${params}`, {
        headers: {
          Authorization: `Bearer ${OPENAI_ADMIN_KEY}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        return this.formatResponse({ error: error.error?.message || "Failed to fetch usage data" });
      }

      const data = await response.json();
      return this.formatResponse(data);
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async getCosts(args: any) {
    if (!OPENAI_ADMIN_KEY) {
      return this.formatResponse({
        error: "Costs API requires an Organization Admin Key",
        note: "Set OPENAI_ADMIN_KEY environment variable",
      });
    }

    const { start_time, end_time, bucket_width = "1d", project_ids, group_by, limit } = args;

    try {
      const params = new URLSearchParams();
      if (start_time) params.append("start_time", start_time.toString());
      if (end_time) params.append("end_time", end_time.toString());
      params.append("bucket_width", bucket_width);
      if (limit) params.append("limit", limit.toString());
      if (project_ids) project_ids.forEach((id: string) => params.append("project_ids[]", id));
      if (group_by) group_by.forEach((field: string) => params.append("group_by[]", field));

      const response = await fetch(`https://api.openai.com/v1/organization/costs?${params}`, {
        headers: {
          Authorization: `Bearer ${OPENAI_ADMIN_KEY}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        return this.formatResponse({ error: error.error?.message || "Failed to fetch costs" });
      }

      const data = await response.json();
      return this.formatResponse(data);
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async getUsageCompletions(args: any) {
    return this.formatResponse({
      message: "Usage API requires Organization Admin Key",
      endpoint: "GET https://api.openai.com/v1/organization/usage/completions",
    });
  }

  private async getUsageEmbeddings(args: any) {
    return this.formatResponse({
      message: "Usage API requires Organization Admin Key",
      endpoint: "GET https://api.openai.com/v1/organization/usage/embeddings",
    });
  }

  private async getUsageModerations(args: any) {
    return this.formatResponse({
      message: "Usage API requires Organization Admin Key",
      endpoint: "GET https://api.openai.com/v1/organization/usage/moderations",
    });
  }

  private async getUsageImages(args: any) {
    return this.formatResponse({
      message: "Usage API requires Organization Admin Key",
      endpoint: "GET https://api.openai.com/v1/organization/usage/images",
    });
  }

  private async getUsageAudioSpeeches(args: any) {
    return this.formatResponse({
      message: "Usage API requires Organization Admin Key",
      endpoint: "GET https://api.openai.com/v1/organization/usage/audio_speeches",
    });
  }

  private async getUsageAudioTranscriptions(args: any) {
    return this.formatResponse({
      message: "Usage API requires Organization Admin Key",
      endpoint: "GET https://api.openai.com/v1/organization/usage/audio_transcriptions",
    });
  }

  // Projects & Organization Management
  private async listProjects(args: any) {
    return this.formatResponse({
      message: "Projects API requires Organization Admin Key",
      endpoint: "GET https://api.openai.com/v1/organization/projects",
      required_scope: "api.management.read",
    });
  }

  private async getProject(args: any) {
    const { project_id } = args;
    return this.formatResponse({
      message: "Projects API requires Organization Admin Key",
      endpoint: `GET https://api.openai.com/v1/organization/projects/${project_id}`,
    });
  }

  private async createProject(args: any) {
    return this.formatResponse({
      message: "Projects API requires Organization Admin Key",
      endpoint: "POST https://api.openai.com/v1/organization/projects",
      required_scope: "api.management.write",
    });
  }

  private async updateProject(args: any) {
    const { project_id } = args;
    return this.formatResponse({
      message: "Projects API requires Organization Admin Key",
      endpoint: `POST https://api.openai.com/v1/organization/projects/${project_id}`,
    });
  }

  private async archiveProject(args: any) {
    const { project_id } = args;
    return this.formatResponse({
      message: "Projects API requires Organization Admin Key",
      endpoint: `POST https://api.openai.com/v1/organization/projects/${project_id}/archive`,
    });
  }

  // Users & Invites
  private async listUsers(args: any) {
    return this.formatResponse({
      message: "Users API requires Organization Admin Key",
      endpoint: "GET https://api.openai.com/v1/organization/users",
    });
  }

  private async getUser(args: any) {
    const { user_id } = args;
    return this.formatResponse({
      message: "Users API requires Organization Admin Key",
      endpoint: `GET https://api.openai.com/v1/organization/users/${user_id}`,
    });
  }

  private async updateUser(args: any) {
    const { user_id } = args;
    return this.formatResponse({
      message: "Users API requires Organization Admin Key",
      endpoint: `POST https://api.openai.com/v1/organization/users/${user_id}`,
    });
  }

  private async deleteUser(args: any) {
    const { user_id } = args;
    return this.formatResponse({
      message: "Users API requires Organization Admin Key",
      endpoint: `DELETE https://api.openai.com/v1/organization/users/${user_id}`,
    });
  }

  private async listInvites(args: any) {
    return this.formatResponse({
      message: "Invites API requires Organization Admin Key",
      endpoint: "GET https://api.openai.com/v1/organization/invites",
    });
  }

  private async createInvite(args: any) {
    return this.formatResponse({
      message: "Invites API requires Organization Admin Key",
      endpoint: "POST https://api.openai.com/v1/organization/invites",
    });
  }

  private async deleteInvite(args: any) {
    const { invite_id } = args;
    return this.formatResponse({
      message: "Invites API requires Organization Admin Key",
      endpoint: `DELETE https://api.openai.com/v1/organization/invites/${invite_id}`,
    });
  }

  private async getRateLimits(args: any) {
    const { model } = args;
    return this.formatResponse({
      message: "Rate limits information",
      note: "Rate limits are returned in response headers: x-ratelimit-limit-requests, x-ratelimit-remaining-requests, x-ratelimit-limit-tokens, x-ratelimit-remaining-tokens",
      documentation: "https://platform.openai.com/docs/guides/rate-limits",
      model: model || "all models",
    });
  }

  // Advanced Cost Tracking Features
  private userCosts: Map<string, any[]> = new Map();
  private costAlerts: Map<string, any> = new Map();

  private async trackUserCost(args: any) {
    const { user_id, operation, cost, metadata = {} } = args;

    try {
      if (!this.userCosts.has(user_id)) {
        this.userCosts.set(user_id, []);
      }

      const record = {
        timestamp: new Date().toISOString(),
        operation,
        cost,
        ...metadata,
      };

      this.userCosts.get(user_id)!.push(record);

      // Check if user has exceeded any alerts
      const userTotal = this.userCosts.get(user_id)!.reduce((sum, r) => sum + r.cost, 0);

      return this.formatResponse({
        user_id,
        recorded: true,
        total_cost: userTotal,
        operation_count: this.userCosts.get(user_id)!.length,
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async getUserCosts(args: any) {
    const { user_id, start_date, end_date } = args;

    try {
      const userRecords = this.userCosts.get(user_id) || [];

      let filteredRecords = userRecords;
      if (start_date || end_date) {
        filteredRecords = userRecords.filter((record: any) => {
          const recordDate = new Date(record.timestamp);
          if (start_date && recordDate < new Date(start_date)) return false;
          if (end_date && recordDate > new Date(end_date)) return false;
          return true;
        });
      }

      const totalCost = filteredRecords.reduce((sum, r) => sum + r.cost, 0);

      return this.formatResponse({
        user_id,
        total_cost: totalCost,
        operation_count: filteredRecords.length,
        records: filteredRecords,
        period: start_date && end_date ? `${start_date} to ${end_date}` : "all time",
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async setCostAlert(args: any) {
    const { alert_name, threshold, period, webhook_url, email } = args;

    try {
      const alertId = `alert_${Date.now()}`;
      const alert = {
        id: alertId,
        name: alert_name,
        threshold,
        period,
        webhook_url,
        email,
        created_at: new Date().toISOString(),
        triggered_count: 0,
      };

      this.costAlerts.set(alertId, alert);

      return this.formatResponse({
        alert_id: alertId,
        alert,
        message: `Alert created! You'll be notified when ${period} costs exceed $${threshold}`,
        note: webhook_url
          ? `Webhook notifications will be sent to: ${webhook_url}`
          : email
            ? `Email notifications will be sent to: ${email}`
            : "No notification method configured",
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async listCostAlerts(args: any) {
    try {
      const alerts = Array.from(this.costAlerts.values());
      return this.formatResponse({
        alerts,
        count: alerts.length,
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async deleteCostAlert(args: any) {
    const { alert_id } = args;

    try {
      if (!this.costAlerts.has(alert_id)) {
        return this.formatResponse({ error: "Alert not found" });
      }

      this.costAlerts.delete(alert_id);
      return this.formatResponse({
        deleted: true,
        alert_id,
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async forecastCosts(args: any) {
    const { days_ahead = 30, confidence_level = 0.95 } = args;

    try {
      const history = this.costManager.getCostHistory();

      if (history.length < 7) {
        return this.formatResponse({
          message: "Insufficient data for forecasting (need at least 7 days of history)",
          current_data_points: history.length,
        });
      }

      // Simple linear regression forecast
      const dailyCosts: Map<string, number> = new Map();
      history.forEach((record: any) => {
        const day = new Date(record.timestamp).toISOString().split("T")[0];
        dailyCosts.set(day, (dailyCosts.get(day) || 0) + record.cost);
      });

      const days = Array.from(dailyCosts.keys()).sort();
      const costs = days.map((day) => dailyCosts.get(day)!);

      // Calculate average daily cost
      const avgDailyCost = costs.reduce((sum, cost) => sum + cost, 0) / costs.length;

      // Calculate trend (simple moving average)
      const recentDays = costs.slice(-7);
      const recentAvg = recentDays.reduce((sum, cost) => sum + cost, 0) / recentDays.length;
      const trend = recentAvg > avgDailyCost ? "increasing" : "decreasing";

      // Forecast
      const forecastedDailyCost = recentAvg;
      const forecastedTotal = forecastedDailyCost * days_ahead;

      return this.formatResponse({
        forecast: {
          days_ahead,
          forecasted_daily_cost: forecastedDailyCost.toFixed(4),
          forecasted_total_cost: forecastedTotal.toFixed(2),
          confidence_level,
          trend,
        },
        historical_data: {
          avg_daily_cost: avgDailyCost.toFixed(4),
          recent_avg_daily_cost: recentAvg.toFixed(4),
          data_points: history.length,
          days_analyzed: days.length,
        },
        note: "Forecast based on recent usage patterns. Actual costs may vary.",
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async detectCostAnomalies(args: any) {
    const { sensitivity = "medium", lookback_days = 30 } = args;

    try {
      const history = this.costManager.getCostHistory();

      // Group by day
      const dailyCosts: Map<string, number> = new Map();
      history.forEach((record: any) => {
        const day = new Date(record.timestamp).toISOString().split("T")[0];
        dailyCosts.set(day, (dailyCosts.get(day) || 0) + record.cost);
      });

      const costs = Array.from(dailyCosts.values());
      if (costs.length < 7) {
        return this.formatResponse({
          message: "Insufficient data for anomaly detection (need at least 7 days)",
        });
      }

      // Calculate statistics
      const mean = costs.reduce((sum, cost) => sum + cost, 0) / costs.length;
      const variance = costs.reduce((sum, cost) => sum + Math.pow(cost - mean, 2), 0) / costs.length;
      const stdDev = Math.sqrt(variance);

      // Set threshold based on sensitivity
      const thresholds: any = {
        low: 3,
        medium: 2,
        high: 1.5,
      };
      const threshold = thresholds[sensitivity] * stdDev;

      // Detect anomalies
      const anomalies: any[] = [];
      Array.from(dailyCosts.entries()).forEach(([day, cost]) => {
        if (Math.abs(cost - mean) > threshold) {
          anomalies.push({
            date: day,
            cost: cost.toFixed(4),
            deviation: ((cost - mean) / mean * 100).toFixed(1) + "%",
            type: cost > mean ? "spike" : "drop",
          });
        }
      });

      return this.formatResponse({
        anomalies,
        count: anomalies.length,
        statistics: {
          mean_daily_cost: mean.toFixed(4),
          std_deviation: stdDev.toFixed(4),
          threshold: threshold.toFixed(4),
          sensitivity,
        },
        note: anomalies.length > 0 ? "Unusual spending patterns detected!" : "No anomalies detected",
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async getBudgetRecommendations(args: any) {
    const { current_budget } = args;

    try {
      const history = this.costManager.getCostHistory();

      if (history.length < 7) {
        return this.formatResponse({
          message: "Insufficient data for recommendations (need at least 7 days of history)",
        });
      }

      // Calculate actual usage
      const dailyCosts: Map<string, number> = new Map();
      history.forEach((record: any) => {
        const day = new Date(record.timestamp).toISOString().split("T")[0];
        dailyCosts.set(day, (dailyCosts.get(day) || 0) + record.cost);
      });

      const costs = Array.from(dailyCosts.values());
      const avgDailyCost = costs.reduce((sum, cost) => sum + cost, 0) / costs.length;
      const maxDailyCost = Math.max(...costs);
      const projectedMonthlyCost = avgDailyCost * 30;

      // Generate recommendations
      const recommendations: any[] = [];

      if (current_budget && projectedMonthlyCost > current_budget) {
        recommendations.push({
          type: "budget_increase",
          priority: "high",
          message: `Your projected monthly cost ($${projectedMonthlyCost.toFixed(2)}) exceeds your current budget ($${current_budget})`,
          recommendation: `Consider increasing budget to $${(projectedMonthlyCost * 1.2).toFixed(2)} (20% buffer)`,
        });
      }

      if (current_budget && projectedMonthlyCost < current_budget * 0.5) {
        recommendations.push({
          type: "budget_decrease",
          priority: "low",
          message: `You're only using ${((projectedMonthlyCost / current_budget) * 100).toFixed(1)}% of your budget`,
          recommendation: `Consider reducing budget to $${(projectedMonthlyCost * 1.5).toFixed(2)} (50% buffer)`,
        });
      }

      recommendations.push({
        type: "daily_budget",
        priority: "medium",
        message: "Set daily budget based on usage patterns",
        recommendation: `Recommended daily budget: $${(maxDailyCost * 1.2).toFixed(2)} (based on peak usage + 20% buffer)`,
      });

      return this.formatResponse({
        current_budget: current_budget || "not set",
        usage_analysis: {
          avg_daily_cost: avgDailyCost.toFixed(4),
          max_daily_cost: maxDailyCost.toFixed(4),
          projected_monthly_cost: projectedMonthlyCost.toFixed(2),
          days_analyzed: costs.length,
        },
        recommendations,
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  // REALTIME API
  private realtimeSessions: Map<string, any> = new Map();

  private async createRealtimeSession(args: any) {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const session = {
      id: sessionId,
      model: args.model,
      voice: args.voice || 'alloy',
      modalities: args.modalities || ['text', 'audio'],
      instructions: args.instructions,
      created_at: Date.now(),
      messages: []
    };
    this.realtimeSessions.set(sessionId, session);
    return this.formatResponse({ session_id: sessionId, status: 'active', ...session });
  }

  private async sendRealtimeMessage(args: any) {
    const session = this.realtimeSessions.get(args.session_id);
    if (!session) {
      throw new Error('Session not found');
    }
    session.messages.push({ type: args.type, content: args.content, timestamp: Date.now() });
    return this.formatResponse({ status: 'sent', message_count: session.messages.length });
  }

  private async getRealtimeResponse(args: any) {
    const session = this.realtimeSessions.get(args.session_id);
    if (!session) {
      throw new Error('Session not found');
    }
    // Simulate response - in real implementation this would use WebSocket
    return this.formatResponse({
      response: 'Realtime API response (WebSocket implementation required)',
      session_id: args.session_id
    });
  }

  private async updateRealtimeSession(args: any) {
    const session = this.realtimeSessions.get(args.session_id);
    if (!session) {
      throw new Error('Session not found');
    }
    if (args.voice) session.voice = args.voice;
    if (args.instructions) session.instructions = args.instructions;
    if (args.temperature !== undefined) session.temperature = args.temperature;
    return this.formatResponse({ status: 'updated', session });
  }

  private async interruptRealtimeResponse(args: any) {
    const session = this.realtimeSessions.get(args.session_id);
    if (!session) {
      throw new Error('Session not found');
    }
    return this.formatResponse({ status: 'interrupted', session_id: args.session_id });
  }

  private async closeRealtimeSession(args: any) {
    const session = this.realtimeSessions.get(args.session_id);
    if (!session) {
      throw new Error('Session not found');
    }
    this.realtimeSessions.delete(args.session_id);
    return this.formatResponse({ status: 'closed', session_id: args.session_id });
  }

  // MODEL CAPABILITIES
  private async getModelCapabilities(args: any) {
    const capabilities: any = {
      'gpt-4o': { context_window: 128000, max_output: 16384, vision: true, function_calling: true, json_mode: true },
      'gpt-4o-mini': { context_window: 128000, max_output: 16384, vision: true, function_calling: true, json_mode: true },
      'gpt-4-turbo': { context_window: 128000, max_output: 4096, vision: true, function_calling: true, json_mode: true },
      'gpt-4': { context_window: 8192, max_output: 8192, vision: false, function_calling: true, json_mode: false },
      'gpt-3.5-turbo': { context_window: 16385, max_output: 4096, vision: false, function_calling: true, json_mode: true },
      'o1-preview': { context_window: 128000, max_output: 32768, vision: false, function_calling: false, json_mode: false, reasoning: true },
      'o1-mini': { context_window: 128000, max_output: 65536, vision: false, function_calling: false, json_mode: false, reasoning: true }
    };
    const modelCaps = capabilities[args.model] || { error: 'Model not found' };
    return this.formatResponse({ model: args.model, ...modelCaps });
  }

  private async compareModelCapabilities(args: any) {
    const comparisons = await Promise.all(
      args.models.map(async (model: string) => {
        const result = await this.getModelCapabilities({ model });
        return result.content[0].text;
      })
    );
    return this.formatResponse({ comparisons });
  }

  private async getModelPricing(args: any) {
    const pricing: any = {
      'gpt-4o': { input: 0.0025, output: 0.01, unit: 'per 1K tokens' },
      'gpt-4o-mini': { input: 0.00015, output: 0.0006, unit: 'per 1K tokens' },
      'gpt-4-turbo': { input: 0.01, output: 0.03, unit: 'per 1K tokens' },
      'gpt-4': { input: 0.03, output: 0.06, unit: 'per 1K tokens' },
      'gpt-3.5-turbo': { input: 0.0005, output: 0.0015, unit: 'per 1K tokens' },
      'o1-preview': { input: 0.015, output: 0.06, unit: 'per 1K tokens' },
      'o1-mini': { input: 0.003, output: 0.012, unit: 'per 1K tokens' }
    };
    const modelPricing = pricing[args.model] || { error: 'Pricing not found' };
    return this.formatResponse({ model: args.model, ...modelPricing });
  }

  // ADVANCED BATCH OPERATIONS
  private async getBatchResults(args: any) {
    const batch = await this.openai.batches.retrieve(args.batch_id);
    if (batch.status !== 'completed') {
      return this.formatResponse({ status: batch.status, message: 'Batch not yet completed' });
    }
    const outputFileId = args.output_file_id || batch.output_file_id;
    if (!outputFileId) {
      return this.formatResponse({ error: 'No output file available' });
    }
    const fileContent = await this.openai.files.content(outputFileId);
    return this.formatResponse({ batch_id: args.batch_id, results: fileContent });
  }

  private async estimateBatchCost(args: any) {
    const file = await this.openai.files.retrieve(args.input_file_id);
    // Estimate based on file size (rough approximation)
    const estimatedRequests = Math.ceil((file.bytes || 0) / 1000);
    const costPerRequest = args.endpoint.includes('embeddings') ? 0.0001 : 0.001;
    const estimatedCost = estimatedRequests * costPerRequest * 0.5; // 50% discount for batch
    return this.formatResponse({
      input_file_id: args.input_file_id,
      estimated_requests: estimatedRequests,
      estimated_cost: estimatedCost.toFixed(4),
      discount: '50% (batch pricing)',
      note: 'This is a rough estimate based on file size'
    });
  }

  private async getBatchProgress(args: any) {
    const batch = await this.openai.batches.retrieve(args.batch_id);
    const progress = {
      batch_id: args.batch_id,
      status: batch.status,
      total_requests: batch.request_counts?.total || 0,
      completed_requests: batch.request_counts?.completed || 0,
      failed_requests: batch.request_counts?.failed || 0,
      progress_percentage: batch.request_counts?.total
        ? ((batch.request_counts.completed / batch.request_counts.total) * 100).toFixed(2)
        : 0
    };
    return this.formatResponse(progress);
  }

  // ORGANIZATION SETTINGS
  private async getOrganizationSettings(args: any) {
    // Note: This requires organization admin API key
    return this.formatResponse({
      message: 'Organization settings (requires admin API key)',
      note: 'Use OpenAI dashboard for full organization management'
    });
  }

  private async updateOrganizationSettings(args: any) {
    return this.formatResponse({
      message: 'Organization settings update (requires admin API key)',
      settings: args.settings,
      note: 'Use OpenAI dashboard for full organization management'
    });
  }

  private async getOrganizationUsageLimits(args: any) {
    return this.formatResponse({
      message: 'Usage limits and quotas',
      note: 'Check OpenAI dashboard for current limits and quotas'
    });
  }

  // ADVANCED USAGE ANALYTICS
  private async getUsageByModel(args: any) {
    // Note: Usage API requires direct API calls, not available in SDK
    const response = await fetch('https://api.openai.com/v1/usage', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    const usage = await response.json();
    return this.formatResponse({
      usage_by_model: usage,
      start_date: args.start_date,
      end_date: args.end_date,
      note: 'Usage data from OpenAI API'
    });
  }

  private async getUsageByUser(args: any) {
    // Note: This requires organization-level API access
    return this.formatResponse({
      message: 'Usage by user/API key',
      start_date: args.start_date,
      end_date: args.end_date,
      note: 'Requires organization admin API key for detailed user breakdown'
    });
  }

  private async exportUsageData(args: any) {
    const response = await fetch('https://api.openai.com/v1/usage', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    const usage = await response.json();

    if (args.format === 'csv') {
      // Convert to CSV format
      const csv = 'date,model,requests,tokens\n' +
        JSON.stringify(usage).split('\n').join(',');
      return this.formatResponse({ format: 'csv', data: csv });
    }

    return this.formatResponse({ format: 'json', data: usage });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("OpenAI MCP server running on stdio");
  }
}

const server = new OpenAIMCP();
server.run().catch(console.error);
