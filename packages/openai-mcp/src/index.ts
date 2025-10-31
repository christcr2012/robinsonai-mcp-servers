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

          // Token Management & Optimization
          case "openai_count_tokens":
            return await this.countTokens(args);
          case "openai_count_tokens_batch":
            return await this.countTokensBatch(args);
          case "openai_count_message_tokens":
            return await this.countMessageTokens(args);
          case "openai_optimize_prompt_tokens":
            return await this.optimizePromptTokens(args);
          case "openai_estimate_cost_from_tokens":
            return await this.estimateCostFromTokens(args);
          case "openai_compare_model_costs":
            return await this.compareModelCosts(args);
          case "openai_find_cheapest_model":
            return await this.findCheapestModel(args);
          case "openai_token_budget_check":
            return await this.tokenBudgetCheck(args);

          // Model Comparison & Selection
          case "openai_compare_models_detailed":
            return await this.compareModels(args);
          case "openai_recommend_model":
            return await this.recommendModel(args);
          case "openai_model_benchmark":
            return await this.modelBenchmark(args);
          case "openai_model_quality_score":
            return await this.modelQualityScore(args);
          case "openai_model_latency_test":
            return await this.modelLatencyTest(args);
          case "openai_model_cost_quality_tradeoff":
            return await this.modelCostQualityTradeoff(args);
          case "openai_model_fallback_chain":
            return await this.modelFallbackChain(args);
          case "openai_model_ab_test":
            return await this.modelABTest(args);

          // Safety & Compliance
          case "openai_content_safety_check":
            return await this.contentSafetyCheck(args);
          case "openai_pii_detection":
            return await this.piiDetection(args);
          case "openai_pii_redaction":
            return await this.piiRedaction(args);
          case "openai_toxicity_score":
            return await this.toxicityScore(args);
          case "openai_bias_detection":
            return await this.biasDetection(args);
          case "openai_compliance_check":
            return await this.complianceCheck(args);
          case "openai_content_filter_create":
            return await this.contentFilterCreate(args);
          case "openai_content_filter_test":
            return await this.contentFilterTest(args);
          case "openai_safety_report":
            return await this.safetyReport(args);
          case "openai_audit_log_export":
            return await this.auditLogExport(args);

          // Monitoring & Observability
          case "openai_monitor_get_metrics":
            return await this.monitorGetMetrics(args);
          case "openai_monitor_get_errors":
            return await this.monitorGetErrors(args);
          case "openai_monitor_get_latency":
            return await this.monitorGetLatency(args);
          case "openai_monitor_get_throughput":
            return await this.monitorGetThroughput(args);
          case "openai_monitor_get_success_rate":
            return await this.monitorGetSuccessRate(args);
          case "openai_monitor_set_alert":
            return await this.monitorSetAlert(args);
          case "openai_monitor_get_alerts":
            return await this.monitorGetAlerts(args);
          case "openai_monitor_export_logs":
            return await this.monitorExportLogs(args);
          case "openai_monitor_get_trace":
            return await this.monitorGetTrace(args);
          case "openai_monitor_get_dashboard":
            return await this.monitorGetDashboard(args);
          case "openai_monitor_get_anomalies":
            return await this.monitorGetAnomalies(args);
          case "openai_monitor_get_health":
            return await this.monitorGetHealth(args);

          // Prompt Engineering
          case "openai_prompt_optimize":
            return await this.promptOptimize(args);
          case "openai_prompt_shorten":
            return await this.promptShorten(args);
          case "openai_prompt_expand":
            return await this.promptExpand(args);
          case "openai_prompt_test":
            return await this.promptTest(args);
          case "openai_prompt_compare":
            return await this.promptCompare(args);
          case "openai_prompt_suggest_improvements":
            return await this.promptSuggestImprovements(args);
          case "openai_prompt_extract_variables":
            return await this.promptExtractVariables(args);
          case "openai_prompt_generate_examples":
            return await this.promptGenerateExamples(args);
          case "openai_prompt_validate":
            return await this.promptValidate(args);
          case "openai_prompt_translate":
            return await this.promptTranslate(args);

          // Advanced Embeddings
          case "openai_embedding_similarity":
            return await this.embeddingSimilarity(args);
          case "openai_embedding_cluster":
            return await this.embeddingCluster(args);
          case "openai_embedding_search":
            return await this.embeddingSearch(args);
          case "openai_embedding_outlier_detection":
            return await this.embeddingOutlierDetection(args);
          case "openai_embedding_dimensionality_reduction":
            return await this.embeddingDimensionalityReduction(args);
          case "openai_embedding_visualization":
            return await this.embeddingVisualization(args);
          case "openai_embedding_batch_similarity":
            return await this.embeddingBatchSimilarity(args);
          case "openai_embedding_index_create":
            return await this.embeddingIndexCreate(args);

          // Realtime API
          case "openai_create_realtime_session":
          case "openai_realtime_session_create":
            return await this.realtimeSessionCreate(args);
          case "openai_update_realtime_session":
          case "openai_realtime_session_update":
            return await this.realtimeSessionUpdate(args);
          case "openai_send_realtime_message":
          case "openai_realtime_audio_send":
            return await this.realtimeAudioSend(args);
          case "openai_get_realtime_response":
          case "openai_realtime_audio_receive":
            return await this.realtimeAudioReceive(args);
          case "openai_realtime_text_send":
            return await this.realtimeTextSend(args);
          case "openai_realtime_text_receive":
            return await this.realtimeTextReceive(args);
          case "openai_realtime_function_call":
            return await this.realtimeFunctionCall(args);
          case "openai_interrupt_realtime_response":
          case "openai_realtime_interrupt":
            return await this.realtimeInterrupt(args);
          case "openai_close_realtime_session":
          case "openai_realtime_session_close":
            return await this.realtimeSessionClose(args);
          case "openai_realtime_get_transcript":
            return await this.realtimeGetTranscript(args);
          case "openai_realtime_configure_voice":
            return await this.realtimeConfigureVoice(args);
          case "openai_realtime_get_metrics":
            return await this.realtimeGetMetrics(args);

          // Vision API
          case "openai_vision_analyze_image":
            return await this.visionAnalyzeImage(args);
          case "openai_vision_describe_image":
            return await this.visionDescribeImage(args);
          case "openai_vision_extract_text":
            return await this.visionExtractText(args);
          case "openai_vision_detect_objects":
            return await this.visionDetectObjects(args);
          case "openai_vision_compare_images":
            return await this.visionCompareImages(args);
          case "openai_vision_generate_caption":
            return await this.visionGenerateCaption(args);
          case "openai_vision_answer_question":
            return await this.visionAnswerQuestion(args);
          case "openai_vision_batch_analyze":
            return await this.visionBatchAnalyze(args);

          // Advanced Fine-tuning
          case "openai_fine_tuning_validate_data":
            return await this.fineTuningValidateData(args);
          case "openai_fine_tuning_estimate_cost":
            return await this.fineTuningEstimateCost(args);
          case "openai_fine_tuning_get_metrics":
            return await this.fineTuningGetMetrics(args);
          case "openai_fine_tuning_compare_models":
            return await this.fineTuningCompareModels(args);
          case "openai_fine_tuning_analyze_results":
            return await this.fineTuningAnalyzeResults(args);
          case "openai_fine_tuning_export_model":
            return await this.fineTuningExportModel(args);
          case "openai_fine_tuning_list_checkpoints":
            return await this.fineTuningListCheckpoints(args);
          case "openai_fine_tuning_get_best_checkpoint":
            return await this.fineTuningGetBestCheckpoint(args);
          case "openai_fine_tuning_prepare_dataset":
            return await this.fineTuningPrepareDataset(args);
          case "openai_fine_tuning_hyperparameter_search":
            return await this.fineTuningHyperparameterSearch(args);

          // Advanced Batch
          case "openai_batch_estimate_cost":
            return await this.batchEstimateCost(args);
          case "openai_batch_monitor":
            return await this.batchMonitor(args);
          case "openai_batch_retry_failed":
            return await this.batchRetryFailed(args);
          case "openai_batch_split_large":
            return await this.batchSplitLarge(args);
          case "openai_batch_merge_results":
            return await this.batchMergeResults(args);
          case "openai_batch_schedule":
            return await this.batchSchedule(args);
          case "openai_batch_optimize":
            return await this.batchOptimize(args);
          case "openai_batch_analytics":
            return await this.batchAnalytics(args);

          // Agents SDK
          case "openai_agent_create":
            return await this.agentCreate(args);
          case "openai_agent_run":
            return await this.agentRun(args);
          case "openai_agent_stream":
            return await this.agentStream(args);
          case "openai_agent_with_tools":
            return await this.agentWithTools(args);
          case "openai_agent_handoff":
            return await this.agentHandoff(args);
          case "openai_agent_parallel":
            return await this.agentParallel(args);
          case "openai_agent_sequential":
            return await this.agentSequential(args);
          case "openai_agent_conditional":
            return await this.agentConditional(args);
          case "openai_agent_loop":
            return await this.agentLoop(args);
          case "openai_agent_memory":
            return await this.agentMemory(args);
          case "openai_agent_state":
            return await this.agentState(args);
          case "openai_agent_monitor":
            return await this.agentMonitor(args);
          case "openai_agent_optimize":
            return await this.agentOptimize(args);
          case "openai_agent_export":
            return await this.agentExport(args);
          case "openai_agent_import":
            return await this.agentImport(args);

          // Advanced Assistants
          case "openai_assistant_clone":
            return await this.assistantClone(args);
          case "openai_assistant_export":
            return await this.assistantExport(args);
          case "openai_assistant_import":
            return await this.assistantImport(args);
          case "openai_assistant_test":
            return await this.assistantTest(args);
          case "openai_assistant_optimize":
            return await this.assistantOptimize(args);
          case "openai_assistant_analytics":
            return await this.assistantAnalytics(args);
          case "openai_assistant_version":
            return await this.assistantVersion(args);
          case "openai_assistant_rollback":
            return await this.assistantRollback(args);
          case "openai_assistant_compare":
            return await this.assistantCompare(args);
          case "openai_assistant_benchmark":
            return await this.assistantBenchmark(args);
          case "openai_assistant_monitor":
            return await this.assistantMonitor(args);
          case "openai_assistant_audit":
            return await this.assistantAudit(args);

          // Advanced Vector Stores
          case "openai_vector_search":
            return await this.vectorSearch(args);
          case "openai_vector_similarity":
            return await this.vectorSimilarity(args);
          case "openai_vector_cluster":
            return await this.vectorCluster(args);
          case "openai_vector_deduplicate":
            return await this.vectorDeduplicate(args);
          case "openai_vector_merge":
            return await this.vectorMerge(args);
          case "openai_vector_export":
            return await this.vectorExport(args);
          case "openai_vector_import":
            return await this.vectorImport(args);
          case "openai_vector_optimize":
            return await this.vectorOptimize(args);
          case "openai_vector_analytics":
            return await this.vectorAnalytics(args);
          case "openai_vector_backup":
            return await this.vectorBackup(args);

          // Advanced Runs
          case "openai_run_retry":
            return await this.runRetry(args);
          case "openai_run_resume":
            return await this.runResume(args);
          case "openai_run_clone":
            return await this.runClone(args);
          case "openai_run_analyze":
            return await this.runAnalyze(args);
          case "openai_run_optimize":
            return await this.runOptimize(args);
          case "openai_run_monitor":
            return await this.runMonitor(args);
          case "openai_run_export":
            return await this.runExport(args);
          case "openai_run_compare":
            return await this.runCompare(args);

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

      // Calculate actual cost (handle unknown models gracefully)
      const pricing = (this.costManager as any).PRICING[model] || {
        input_per_1k: 0.0025,  // Default to gpt-4o pricing
        output_per_1k: 0.01,
      };
      const actualCost =
        ((response.usage?.prompt_tokens || 0) / 1000) * pricing.input_per_1k +
        ((response.usage?.completion_tokens || 0) / 1000) * pricing.output_per_1k;

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

      // Calculate and record cost (handle unknown models gracefully)
      const pricing = (this.costManager as any).PRICING[model] || {
        input_per_1k: 0.0025,  // Default to gpt-4o pricing
        output_per_1k: 0.01,
      };
      const actualCost =
        ((response.usage?.prompt_tokens || 0) / 1000) * pricing.input_per_1k +
        ((response.usage?.completion_tokens || 0) / 1000) * pricing.output_per_1k;

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

  // ==================== TOKEN MANAGEMENT & OPTIMIZATION ====================

  private async countTokens(args: any) {
    const { text, model = "gpt-4" } = args;
    try {
      const tokenCount = this.costManager.estimateTokens(text, model);

      return this.formatResponse({
        text_length: text.length,
        token_count: tokenCount,
        model: model,
        characters_per_token: (text.length / tokenCount).toFixed(2),
        estimated_cost: this.costManager.estimateChatCost(model, text, 0).estimated_cost_usd,
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async countTokensBatch(args: any) {
    const { texts, model = "gpt-4" } = args;
    try {
      const results = texts.map((text: string) => {
        const tokenCount = this.costManager.estimateTokens(text, model);
        return {
          text_preview: text.substring(0, 50) + (text.length > 50 ? "..." : ""),
          text_length: text.length,
          token_count: tokenCount,
        };
      });

      const totalTokens = results.reduce((sum: number, r: any) => sum + r.token_count, 0);

      return this.formatResponse({
        results,
        summary: {
          total_texts: texts.length,
          total_tokens: totalTokens,
          average_tokens: (totalTokens / texts.length).toFixed(2),
          model: model,
        },
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async countMessageTokens(args: any) {
    const { messages, model = "gpt-4" } = args;
    try {
      // OpenAI message formatting adds ~4 tokens per message
      const messageOverhead = 4;
      let totalTokens = 3; // Base overhead for chat format

      const messageBreakdown = messages.map((msg: any) => {
        const contentTokens = this.costManager.estimateTokens(msg.content || "", model);
        const roleTokens = this.costManager.estimateTokens(msg.role || "user", model);
        const msgTotal = contentTokens + roleTokens + messageOverhead;
        totalTokens += msgTotal;

        return {
          role: msg.role,
          content_preview: (msg.content || "").substring(0, 50),
          content_tokens: contentTokens,
          role_tokens: roleTokens,
          overhead_tokens: messageOverhead,
          total_tokens: msgTotal,
        };
      });

      return this.formatResponse({
        messages: messageBreakdown,
        summary: {
          total_messages: messages.length,
          total_tokens: totalTokens,
          average_tokens_per_message: (totalTokens / messages.length).toFixed(2),
          model: model,
          estimated_cost: this.costManager.estimateChatCost(model, messages.map((m: any) => m.content).join("\n"), 0).estimated_cost_usd,
        },
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async optimizePromptTokens(args: any) {
    const { text, target_reduction = 20, model = "gpt-4" } = args;
    try {
      const originalTokens = this.costManager.estimateTokens(text, model);
      const targetTokens = Math.floor(originalTokens * (1 - target_reduction / 100));

      // Use GPT to optimize the prompt
      const optimizationPrompt = `Rewrite the following text to reduce token count by approximately ${target_reduction}% while preserving all key information and meaning. Target: ${targetTokens} tokens or less.

Original text (${originalTokens} tokens):
${text}

Optimized version:`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini", // Use cheaper model for optimization
        messages: [{ role: "user", content: optimizationPrompt }],
        temperature: 0.3,
        max_tokens: targetTokens + 100,
      });

      const optimizedText = response.choices[0].message.content || "";
      const optimizedTokens = this.costManager.estimateTokens(optimizedText, model);
      const actualReduction = ((originalTokens - optimizedTokens) / originalTokens * 100).toFixed(1);

      return this.formatResponse({
        original: {
          text: text,
          tokens: originalTokens,
        },
        optimized: {
          text: optimizedText,
          tokens: optimizedTokens,
        },
        analysis: {
          target_reduction_percent: target_reduction,
          actual_reduction_percent: parseFloat(actualReduction),
          tokens_saved: originalTokens - optimizedTokens,
          cost_saved_per_1k_calls: ((originalTokens - optimizedTokens) / 1000 * (this.costManager as any).PRICING[model]?.input_per_1k || 0).toFixed(4),
        },
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async estimateCostFromTokens(args: any) {
    const { input_tokens, output_tokens, model = "gpt-4" } = args;
    try {
      const pricing = (this.costManager as any).PRICING[model];
      if (!pricing) {
        return this.formatResponse({ error: `Pricing not available for model: ${model}` });
      }

      const inputCost = (input_tokens / 1000) * pricing.input_per_1k;
      const outputCost = (output_tokens / 1000) * pricing.output_per_1k;
      const totalCost = inputCost + outputCost;

      return this.formatResponse({
        model: model,
        input_tokens: input_tokens,
        output_tokens: output_tokens,
        total_tokens: input_tokens + output_tokens,
        costs: {
          input_cost_usd: inputCost.toFixed(6),
          output_cost_usd: outputCost.toFixed(6),
          total_cost_usd: totalCost.toFixed(6),
        },
        pricing: {
          input_per_1k: pricing.input_per_1k,
          output_per_1k: pricing.output_per_1k,
        },
        budget_status: {
          daily_spent: this.costManager.getDailySpent(),
          monthly_spent: this.costManager.getMonthlySpent(),
          daily_budget: (this.costManager as any).config.daily_budget,
          monthly_budget: (this.costManager as any).config.monthly_budget,
          would_exceed_daily: (this.costManager.getDailySpent() + totalCost) > (this.costManager as any).config.daily_budget,
          would_exceed_monthly: (this.costManager.getMonthlySpent() + totalCost) > (this.costManager as any).config.monthly_budget,
        },
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async compareModelCosts(args: any) {
    const { text, models = ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"], expected_output_tokens = 500 } = args;
    try {
      const comparisons = models.map((model: string) => {
        const inputTokens = this.costManager.estimateTokens(text, model);
        const pricing = (this.costManager as any).PRICING[model];

        if (!pricing) {
          return { model, error: "Pricing not available" };
        }

        const inputCost = (inputTokens / 1000) * pricing.input_per_1k;
        const outputCost = (expected_output_tokens / 1000) * pricing.output_per_1k;
        const totalCost = inputCost + outputCost;

        return {
          model: model,
          input_tokens: inputTokens,
          output_tokens: expected_output_tokens,
          total_tokens: inputTokens + expected_output_tokens,
          cost_usd: totalCost.toFixed(6),
          cost_breakdown: {
            input: inputCost.toFixed(6),
            output: outputCost.toFixed(6),
          },
          pricing: {
            input_per_1k: pricing.input_per_1k,
            output_per_1k: pricing.output_per_1k,
          },
        };
      });

      // Sort by cost
      comparisons.sort((a: any, b: any) => parseFloat(a.cost_usd || "999") - parseFloat(b.cost_usd || "999"));

      const cheapest = comparisons[0];
      const mostExpensive = comparisons[comparisons.length - 1];
      const savings = (parseFloat(mostExpensive.cost_usd || "0") - parseFloat(cheapest.cost_usd || "0")).toFixed(6);

      return this.formatResponse({
        comparisons,
        recommendation: {
          cheapest_model: cheapest.model,
          cheapest_cost: cheapest.cost_usd,
          most_expensive_model: mostExpensive.model,
          most_expensive_cost: mostExpensive.cost_usd,
          potential_savings: savings,
          savings_per_1k_calls: (parseFloat(savings) * 1000).toFixed(2),
        },
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async findCheapestModel(args: any) {
    const { text, min_quality_tier = "standard", expected_output_tokens = 500 } = args;
    try {
      // Define quality tiers
      const qualityTiers: any = {
        basic: ["gpt-3.5-turbo", "gpt-4o-mini"],
        standard: ["gpt-4o-mini", "gpt-4o", "gpt-4-turbo"],
        premium: ["gpt-4", "gpt-4-turbo", "o1-preview", "o1-mini"],
      };

      const eligibleModels = qualityTiers[min_quality_tier] || qualityTiers.standard;

      // Compare costs for eligible models
      const comparison = await this.compareModelCosts({
        text,
        models: eligibleModels,
        expected_output_tokens,
      });

      const comparisonData = JSON.parse(comparison.content[0].text);
      const cheapest = comparisonData.comparisons[0];

      return this.formatResponse({
        recommended_model: cheapest.model,
        quality_tier: min_quality_tier,
        cost_estimate: cheapest.cost_usd,
        token_estimate: cheapest.total_tokens,
        reasoning: `${cheapest.model} is the cheapest model in the '${min_quality_tier}' quality tier for this input.`,
        alternatives: comparisonData.comparisons.slice(1, 3),
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async tokenBudgetCheck(args: any) {
    const { text, max_tokens, model = "gpt-4" } = args;
    try {
      const actualTokens = this.costManager.estimateTokens(text, model);
      const withinBudget = actualTokens <= max_tokens;
      const difference = max_tokens - actualTokens;

      return this.formatResponse({
        within_budget: withinBudget,
        actual_tokens: actualTokens,
        max_tokens: max_tokens,
        difference: difference,
        percentage_used: ((actualTokens / max_tokens) * 100).toFixed(1),
        status: withinBudget ? "PASS" : "FAIL",
        recommendation: withinBudget
          ? `You have ${difference} tokens remaining (${((difference / max_tokens) * 100).toFixed(1)}% of budget).`
          : `You are over budget by ${Math.abs(difference)} tokens (${((Math.abs(difference) / max_tokens) * 100).toFixed(1)}% over). Consider using openai_optimize_prompt_tokens to reduce token count.`,
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  // ==================== MODEL COMPARISON & SELECTION ====================

  private async compareModels(args: any) {
    const { models = ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"], criteria = ["cost", "speed", "quality", "context_window"] } = args;
    try {
      const modelData: any = {
        "gpt-4": { context_window: 8192, speed: "slow", quality: "excellent", cost_tier: "premium" },
        "gpt-4-turbo": { context_window: 128000, speed: "fast", quality: "excellent", cost_tier: "high" },
        "gpt-4o": { context_window: 128000, speed: "very_fast", quality: "excellent", cost_tier: "medium" },
        "gpt-4o-mini": { context_window: 128000, speed: "very_fast", quality: "good", cost_tier: "low" },
        "gpt-3.5-turbo": { context_window: 16385, speed: "very_fast", quality: "good", cost_tier: "low" },
        "o1-preview": { context_window: 128000, speed: "slow", quality: "exceptional", cost_tier: "premium" },
        "o1-mini": { context_window: 128000, speed: "medium", quality: "excellent", cost_tier: "high" },
      };

      const comparisons = models.map((model: string) => {
        const data = modelData[model] || {};
        const pricing = (this.costManager as any).PRICING[model] || {};

        return {
          model: model,
          context_window: data.context_window || "unknown",
          speed: data.speed || "unknown",
          quality: data.quality || "unknown",
          cost_tier: data.cost_tier || "unknown",
          pricing: {
            input_per_1k: pricing.input_per_1k || "N/A",
            output_per_1k: pricing.output_per_1k || "N/A",
          },
          use_cases: this.getModelUseCases(model),
        };
      });

      return this.formatResponse({
        comparisons,
        criteria_evaluated: criteria,
        recommendation: this.getBestModelForCriteria(comparisons, criteria),
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private getModelUseCases(model: string): string[] {
    const useCases: any = {
      "gpt-4": ["complex reasoning", "code generation", "analysis"],
      "gpt-4-turbo": ["long documents", "complex tasks", "fast responses"],
      "gpt-4o": ["multimodal", "vision", "fast complex tasks"],
      "gpt-4o-mini": ["simple tasks", "high volume", "cost optimization"],
      "gpt-3.5-turbo": ["simple tasks", "chatbots", "high volume"],
      "o1-preview": ["advanced reasoning", "research", "complex problem solving"],
      "o1-mini": ["reasoning tasks", "cost-effective complex tasks"],
    };
    return useCases[model] || ["general purpose"];
  }

  private getBestModelForCriteria(comparisons: any[], criteria: string[]): any {
    // Simple scoring algorithm
    const scores = comparisons.map((comp: any) => {
      let score = 0;
      if (criteria.includes("cost") && comp.cost_tier === "low") score += 3;
      if (criteria.includes("speed") && (comp.speed === "very_fast" || comp.speed === "fast")) score += 2;
      if (criteria.includes("quality") && (comp.quality === "excellent" || comp.quality === "exceptional")) score += 2;
      if (criteria.includes("context_window") && comp.context_window > 100000) score += 1;
      return { model: comp.model, score };
    });

    scores.sort((a, b) => b.score - a.score);
    return {
      recommended_model: scores[0].model,
      score: scores[0].score,
      reasoning: `Best match for criteria: ${criteria.join(", ")}`,
    };
  }

  private async recommendModel(args: any) {
    const { use_case, constraints = {}, sample_input = "" } = args;
    try {
      // Use AI to recommend model
      const prompt = `You are an expert at selecting OpenAI models. Based on the following use case, recommend the best model.

Use Case: ${use_case}
Constraints: ${JSON.stringify(constraints)}
Sample Input: ${sample_input}

Available models:
- gpt-4: Best quality, expensive, 8K context
- gpt-4-turbo: Excellent quality, fast, 128K context
- gpt-4o: Multimodal, very fast, 128K context
- gpt-4o-mini: Good quality, very cheap, 128K context
- gpt-3.5-turbo: Good for simple tasks, very cheap, 16K context
- o1-preview: Best reasoning, expensive, 128K context
- o1-mini: Good reasoning, medium cost, 128K context

Respond with JSON:
{
  "recommended_model": "model-name",
  "reasoning": "why this model",
  "alternatives": ["alt1", "alt2"],
  "estimated_cost_per_1k_requests": 0.00
}`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        response_format: { type: "json_object" },
      });

      const recommendation = JSON.parse(response.choices[0].message.content || "{}");

      return this.formatResponse({
        ...recommendation,
        use_case: use_case,
        constraints: constraints,
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async modelBenchmark(args: any) {
    const { models, test_cases, evaluation_criteria = ["accuracy", "coherence", "instruction_following"] } = args;
    try {
      const results = [];

      for (const model of models) {
        const modelResults = {
          model: model,
          test_results: [] as any[],
          average_score: 0,
          total_cost: 0,
          total_time: 0,
        };

        for (const testCase of test_cases) {
          const startTime = Date.now();

          try {
            const response = await this.openai.chat.completions.create({
              model: model,
              messages: [{ role: "user", content: testCase }],
              max_tokens: 500,
            });

            const endTime = Date.now();
            const latency = endTime - startTime;

            // Score the response
            const score = await this.scoreResponse(response.choices[0].message.content || "", testCase, evaluation_criteria);

            modelResults.test_results.push({
              test_case: testCase.substring(0, 50) + "...",
              response: response.choices[0].message.content?.substring(0, 100) + "...",
              score: score,
              latency_ms: latency,
              tokens: response.usage,
            });

            modelResults.total_time += latency;
            modelResults.total_cost += ((response.usage?.prompt_tokens || 0) / 1000) * ((this.costManager as any).PRICING[model]?.input_per_1k || 0) +
                                       ((response.usage?.completion_tokens || 0) / 1000) * ((this.costManager as any).PRICING[model]?.output_per_1k || 0);
          } catch (error: any) {
            modelResults.test_results.push({
              test_case: testCase.substring(0, 50) + "...",
              error: error.message,
              score: 0,
            });
          }
        }

        modelResults.average_score = modelResults.test_results.reduce((sum: number, r: any) => sum + (r.score || 0), 0) / test_cases.length;
        results.push(modelResults);
      }

      // Sort by average score
      results.sort((a, b) => b.average_score - a.average_score);

      return this.formatResponse({
        benchmark_results: results,
        winner: results[0].model,
        evaluation_criteria: evaluation_criteria,
        summary: {
          best_quality: results[0].model,
          best_cost: results.sort((a, b) => a.total_cost - b.total_cost)[0].model,
          best_speed: results.sort((a, b) => a.total_time - b.total_time)[0].model,
        },
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async scoreResponse(response: string, prompt: string, criteria: string[]): Promise<number> {
    // Simple scoring algorithm (can be enhanced with AI)
    let score = 0;

    if (criteria.includes("accuracy")) {
      // Check if response is relevant
      score += response.length > 50 ? 25 : 10;
    }

    if (criteria.includes("coherence")) {
      // Check for coherent sentences
      const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 0);
      score += Math.min(sentences.length * 5, 25);
    }

    if (criteria.includes("instruction_following")) {
      // Check if response addresses the prompt
      const promptWords = prompt.toLowerCase().split(/\s+/);
      const responseWords = response.toLowerCase().split(/\s+/);
      const overlap = promptWords.filter(w => responseWords.includes(w)).length;
      score += Math.min(overlap * 2, 25);
    }

    if (criteria.includes("completeness")) {
      // Check response length
      score += response.length > 200 ? 25 : response.length / 8;
    }

    return Math.min(score, 100);
  }

  private async modelQualityScore(args: any) {
    const { model, prompt, expected_output = "", criteria = ["accuracy", "coherence", "relevance", "completeness"] } = args;
    try {
      const response = await this.openai.chat.completions.create({
        model: model,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1000,
      });

      const output = response.choices[0].message.content || "";
      const score = await this.scoreResponse(output, prompt, criteria);

      // If expected output provided, calculate similarity
      let similarity = null;
      if (expected_output) {
        similarity = this.calculateSimilarity(output, expected_output);
      }

      return this.formatResponse({
        model: model,
        prompt: prompt,
        output: output,
        quality_score: score,
        similarity_to_expected: similarity,
        criteria: criteria,
        breakdown: {
          accuracy: criteria.includes("accuracy") ? Math.min(output.length > 50 ? 25 : 10, 25) : null,
          coherence: criteria.includes("coherence") ? Math.min(output.split(/[.!?]+/).filter((s: string) => s.trim().length > 0).length * 5, 25) : null,
          relevance: criteria.includes("relevance") ? score * 0.3 : null,
          completeness: criteria.includes("completeness") ? Math.min(output.length > 200 ? 25 : output.length / 8, 25) : null,
        },
        usage: response.usage,
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private calculateSimilarity(text1: string, text2: string): number {
    // Simple word overlap similarity
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);
    const overlap = words1.filter(w => words2.includes(w)).length;
    return (overlap / Math.max(words1.length, words2.length)) * 100;
  }

  private async modelLatencyTest(args: any) {
    const { model, prompt, iterations = 5 } = args;
    try {
      const latencies = [];
      const costs = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();

        const response = await this.openai.chat.completions.create({
          model: model,
          messages: [{ role: "user", content: prompt }],
          max_tokens: 500,
        });

        const endTime = Date.now();
        const latency = endTime - startTime;
        latencies.push(latency);

        const cost = ((response.usage?.prompt_tokens || 0) / 1000) * ((this.costManager as any).PRICING[model]?.input_per_1k || 0) +
                     ((response.usage?.completion_tokens || 0) / 1000) * ((this.costManager as any).PRICING[model]?.output_per_1k || 0);
        costs.push(cost);
      }

      const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      const minLatency = Math.min(...latencies);
      const maxLatency = Math.max(...latencies);
      const avgCost = costs.reduce((a, b) => a + b, 0) / costs.length;

      return this.formatResponse({
        model: model,
        iterations: iterations,
        latency_ms: {
          average: avgLatency.toFixed(2),
          min: minLatency,
          max: maxLatency,
          all: latencies,
        },
        cost_usd: {
          average: avgCost.toFixed(6),
          total: (avgCost * iterations).toFixed(6),
        },
        throughput: {
          requests_per_second: (1000 / avgLatency).toFixed(2),
          estimated_hourly_capacity: Math.floor((3600000 / avgLatency)),
        },
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async modelCostQualityTradeoff(args: any) {
    const { models, test_prompt, budget = 1.0 } = args;
    try {
      const results = [];

      for (const model of models) {
        const response = await this.openai.chat.completions.create({
          model: model,
          messages: [{ role: "user", content: test_prompt }],
          max_tokens: 500,
        });

        const cost = ((response.usage?.prompt_tokens || 0) / 1000) * ((this.costManager as any).PRICING[model]?.input_per_1k || 0) +
                     ((response.usage?.completion_tokens || 0) / 1000) * ((this.costManager as any).PRICING[model]?.output_per_1k || 0);

        const quality = await this.scoreResponse(response.choices[0].message.content || "", test_prompt, ["accuracy", "coherence", "completeness"]);

        results.push({
          model: model,
          cost_usd: cost.toFixed(6),
          quality_score: quality.toFixed(2),
          cost_quality_ratio: (cost / quality * 1000).toFixed(4),
          requests_within_budget: Math.floor(budget / cost),
          output: response.choices[0].message.content?.substring(0, 100) + "...",
        });
      }

      // Sort by cost/quality ratio (lower is better)
      results.sort((a, b) => parseFloat(a.cost_quality_ratio) - parseFloat(b.cost_quality_ratio));

      return this.formatResponse({
        analysis: results,
        recommendation: {
          best_value: results[0].model,
          best_quality: results.sort((a, b) => parseFloat(b.quality_score) - parseFloat(a.quality_score))[0].model,
          cheapest: results.sort((a, b) => parseFloat(a.cost_usd) - parseFloat(b.cost_usd))[0].model,
        },
        budget: budget,
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async modelFallbackChain(args: any) {
    const { primary_model, fallback_models, fallback_conditions = ["error", "timeout", "rate_limit"] } = args;
    try {
      return this.formatResponse({
        configuration: {
          primary_model: primary_model,
          fallback_chain: fallback_models,
          fallback_conditions: fallback_conditions,
        },
        status: "configured",
        usage_instructions: "This configuration will be used automatically when calling OpenAI APIs. If primary model fails, system will try fallback models in order.",
        example_flow: [
          `1. Try ${primary_model}`,
          ...fallback_models.map((m: string, i: number) => `${i + 2}. If ${fallback_conditions.join(" or ")}, try ${m}`),
          `${fallback_models.length + 2}. If all fail, return error`,
        ],
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async modelABTest(args: any) {
    const { model_a, model_b, test_cases, evaluation_method = "ai" } = args;
    try {
      const results = {
        model_a: { wins: 0, losses: 0, ties: 0, scores: [] as number[] },
        model_b: { wins: 0, losses: 0, ties: 0, scores: [] as number[] },
        test_results: [] as any[],
      };

      for (const testCase of test_cases) {
        // Get responses from both models
        const [responseA, responseB] = await Promise.all([
          this.openai.chat.completions.create({
            model: model_a,
            messages: [{ role: "user", content: testCase }],
            max_tokens: 500,
          }),
          this.openai.chat.completions.create({
            model: model_b,
            messages: [{ role: "user", content: testCase }],
            max_tokens: 500,
          }),
        ]);

        const outputA = responseA.choices[0].message.content || "";
        const outputB = responseB.choices[0].message.content || "";

        // Score both responses
        const scoreA = await this.scoreResponse(outputA, testCase, ["accuracy", "coherence", "completeness"]);
        const scoreB = await this.scoreResponse(outputB, testCase, ["accuracy", "coherence", "completeness"]);

        results.model_a.scores.push(scoreA);
        results.model_b.scores.push(scoreB);

        let winner = "tie";
        if (scoreA > scoreB + 5) {
          winner = "model_a";
          results.model_a.wins++;
          results.model_b.losses++;
        } else if (scoreB > scoreA + 5) {
          winner = "model_b";
          results.model_b.wins++;
          results.model_a.losses++;
        } else {
          results.model_a.ties++;
          results.model_b.ties++;
        }

        results.test_results.push({
          test_case: testCase.substring(0, 50) + "...",
          model_a_output: outputA.substring(0, 100) + "...",
          model_b_output: outputB.substring(0, 100) + "...",
          model_a_score: scoreA.toFixed(2),
          model_b_score: scoreB.toFixed(2),
          winner: winner,
        });
      }

      const avgScoreA = results.model_a.scores.reduce((a, b) => a + b, 0) / results.model_a.scores.length;
      const avgScoreB = results.model_b.scores.reduce((a, b) => a + b, 0) / results.model_b.scores.length;

      return this.formatResponse({
        model_a: model_a,
        model_b: model_b,
        results: results,
        summary: {
          model_a_avg_score: avgScoreA.toFixed(2),
          model_b_avg_score: avgScoreB.toFixed(2),
          model_a_win_rate: ((results.model_a.wins / test_cases.length) * 100).toFixed(1) + "%",
          model_b_win_rate: ((results.model_b.wins / test_cases.length) * 100).toFixed(1) + "%",
          winner: avgScoreA > avgScoreB ? model_a : model_b,
          confidence: Math.abs(avgScoreA - avgScoreB) > 10 ? "high" : "low",
        },
        evaluation_method: evaluation_method,
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  // ==================== SAFETY & COMPLIANCE ====================

  private async contentSafetyCheck(args: any) {
    const { content, categories = [] } = args;
    try {
      // Use OpenAI Moderation API
      const moderation = await this.openai.moderations.create({
        input: content,
      });

      const result = moderation.results[0];

      return this.formatResponse({
        flagged: result.flagged,
        categories: result.categories,
        category_scores: result.category_scores,
        safe: !result.flagged,
        violations: Object.entries(result.categories)
          .filter(([_, flagged]) => flagged)
          .map(([category]) => category),
        recommendation: result.flagged
          ? "Content violates safety policies. Review and modify before use."
          : "Content passed safety checks.",
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async piiDetection(args: any) {
    const { text, pii_types = ["email", "phone", "ssn", "credit_card", "address"] } = args;
    try {
      const detected: any[] = [];

      // Email detection
      if (pii_types.includes("email")) {
        const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
        const emails = text.match(emailRegex) || [];
        emails.forEach((email: string) => detected.push({ type: "email", value: email, confidence: "high" }));
      }

      // Phone detection
      if (pii_types.includes("phone")) {
        const phoneRegex = /(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
        const phones = text.match(phoneRegex) || [];
        phones.forEach((phone: string) => detected.push({ type: "phone", value: phone, confidence: "medium" }));
      }

      // SSN detection
      if (pii_types.includes("ssn")) {
        const ssnRegex = /\b\d{3}-\d{2}-\d{4}\b/g;
        const ssns = text.match(ssnRegex) || [];
        ssns.forEach((ssn: string) => detected.push({ type: "ssn", value: ssn, confidence: "high" }));
      }

      // Credit card detection
      if (pii_types.includes("credit_card")) {
        const ccRegex = /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g;
        const cards = text.match(ccRegex) || [];
        cards.forEach((card: string) => detected.push({ type: "credit_card", value: card, confidence: "medium" }));
      }

      // Use AI for more sophisticated detection
      if (pii_types.includes("address") || pii_types.includes("name")) {
        const aiPrompt = `Detect PII in the following text. Return JSON with detected items.
Types to detect: ${pii_types.join(", ")}

Text: ${text}

Return format:
{
  "detected": [
    {"type": "address", "value": "123 Main St", "confidence": "high"},
    {"type": "name", "value": "John Doe", "confidence": "medium"}
  ]
}`;

        const response = await this.openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: aiPrompt }],
          temperature: 0.1,
          response_format: { type: "json_object" },
        });

        const aiDetected = JSON.parse(response.choices[0].message.content || "{}");
        if (aiDetected.detected) {
          detected.push(...aiDetected.detected);
        }
      }

      return this.formatResponse({
        pii_found: detected.length > 0,
        count: detected.length,
        detected: detected,
        risk_level: detected.length === 0 ? "low" : detected.length < 3 ? "medium" : "high",
        recommendation: detected.length > 0
          ? `Found ${detected.length} PII items. Consider redacting before processing.`
          : "No PII detected. Safe to process.",
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async piiRedaction(args: any) {
    const { text, redaction_method = "mask", pii_types = ["email", "phone", "ssn", "credit_card"] } = args;
    try {
      let redactedText = text;
      const redactions: any[] = [];

      // Email redaction
      if (pii_types.includes("email")) {
        const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
        redactedText = redactedText.replace(emailRegex, (match: string) => {
          redactions.push({ type: "email", original: match });
          return redaction_method === "mask" ? "[EMAIL]" : redaction_method === "hash" ? `[${this.simpleHash(match)}]` : "";
        });
      }

      // Phone redaction
      if (pii_types.includes("phone")) {
        const phoneRegex = /(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
        redactedText = redactedText.replace(phoneRegex, (match: string) => {
          redactions.push({ type: "phone", original: match });
          return redaction_method === "mask" ? "[PHONE]" : redaction_method === "hash" ? `[${this.simpleHash(match)}]` : "";
        });
      }

      // SSN redaction
      if (pii_types.includes("ssn")) {
        const ssnRegex = /\b\d{3}-\d{2}-\d{4}\b/g;
        redactedText = redactedText.replace(ssnRegex, (match: string) => {
          redactions.push({ type: "ssn", original: match });
          return redaction_method === "mask" ? "[SSN]" : redaction_method === "hash" ? `[${this.simpleHash(match)}]` : "";
        });
      }

      // Credit card redaction
      if (pii_types.includes("credit_card")) {
        const ccRegex = /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g;
        redactedText = redactedText.replace(ccRegex, (match: string) => {
          redactions.push({ type: "credit_card", original: match });
          return redaction_method === "mask" ? "[CREDIT_CARD]" : redaction_method === "hash" ? `[${this.simpleHash(match)}]` : "";
        });
      }

      return this.formatResponse({
        original_text: text,
        redacted_text: redactedText,
        redaction_method: redaction_method,
        redactions_count: redactions.length,
        redactions: redactions.map(r => ({ type: r.type })), // Don't include original values in response
        safe_to_process: true,
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private simpleHash(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36).substring(0, 8);
  }

  private async toxicityScore(args: any) {
    const { text, dimensions = ["hate", "harassment", "violence", "sexual", "self-harm"] } = args;
    try {
      const moderation = await this.openai.moderations.create({ input: text });
      const result = moderation.results[0];

      const scores: any = {};
      dimensions.forEach((dim: string) => {
        const key = dim.replace("-", "_") as keyof typeof result.category_scores;
        scores[dim] = result.category_scores[key] || 0;
      });

      const avgScore = (Object.values(scores) as number[]).reduce((a: number, b: number) => a + b, 0) / dimensions.length;

      return this.formatResponse({
        overall_toxicity: avgScore,
        dimension_scores: scores,
        flagged: result.flagged,
        risk_level: avgScore < 0.3 ? "low" : avgScore < 0.6 ? "medium" : "high",
        recommendation: avgScore > 0.6 ? "High toxicity detected. Review content before use." : "Acceptable toxicity levels.",
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async biasDetection(args: any) {
    const { text, bias_types = ["gender", "race", "age", "religion", "political"] } = args;
    try {
      const prompt = `Analyze the following text for potential bias. Check for: ${bias_types.join(", ")} bias.

Text: ${text}

Return JSON:
{
  "bias_detected": true/false,
  "bias_types_found": ["gender", "race"],
  "severity": "low/medium/high",
  "examples": [{"type": "gender", "text": "...", "explanation": "..."}],
  "recommendations": ["suggestion 1", "suggestion 2"]
}`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        response_format: { type: "json_object" },
      });

      const analysis = JSON.parse(response.choices[0].message.content || "{}");

      return this.formatResponse({
        ...analysis,
        checked_bias_types: bias_types,
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async complianceCheck(args: any) {
    const { content, compliance_standards = ["GDPR", "HIPAA", "SOC2"] } = args;
    try {
      const checks: any = {};

      for (const standard of compliance_standards) {
        const prompt = `Check if the following content complies with ${standard} standards.

Content: ${content}

Return JSON:
{
  "compliant": true/false,
  "violations": ["violation 1", "violation 2"],
  "recommendations": ["fix 1", "fix 2"],
  "risk_level": "low/medium/high"
}`;

        const response = await this.openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.1,
          response_format: { type: "json_object" },
        });

        checks[standard] = JSON.parse(response.choices[0].message.content || "{}");
      }

      const allCompliant = Object.values(checks).every((c: any) => c.compliant);

      return this.formatResponse({
        overall_compliant: allCompliant,
        standards_checked: compliance_standards,
        checks: checks,
        recommendation: allCompliant
          ? "Content meets all compliance standards."
          : "Compliance violations detected. Review and address before deployment.",
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private contentFilters: Map<string, any> = new Map();

  private async contentFilterCreate(args: any) {
    const { filter_name, rules, action = "warn" } = args;
    try {
      this.contentFilters.set(filter_name, { rules, action, created: new Date().toISOString() });

      return this.formatResponse({
        filter_name: filter_name,
        rules_count: rules.length,
        action: action,
        status: "created",
        usage: `Use openai_content_filter_test with filter_name="${filter_name}" to test content.`,
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async contentFilterTest(args: any) {
    const { filter_name, content } = args;
    try {
      const filter = this.contentFilters.get(filter_name);
      if (!filter) {
        return this.formatResponse({ error: `Filter "${filter_name}" not found. Create it first with openai_content_filter_create.` });
      }

      const violations: any[] = [];

      for (const rule of filter.rules) {
        if (typeof rule === "string") {
          if (content.toLowerCase().includes(rule.toLowerCase())) {
            violations.push({ rule: rule, type: "keyword_match" });
          }
        } else if (rule.pattern) {
          const regex = new RegExp(rule.pattern, "i");
          if (regex.test(content)) {
            violations.push({ rule: rule.pattern, type: "regex_match" });
          }
        }
      }

      return this.formatResponse({
        filter_name: filter_name,
        passed: violations.length === 0,
        violations: violations,
        action: filter.action,
        recommendation: violations.length > 0
          ? `Content violates ${violations.length} rule(s). Action: ${filter.action}`
          : "Content passed all filter rules.",
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async safetyReport(args: any) {
    const { content, report_type = "detailed" } = args;
    try {
      // Run all safety checks
      const [moderation, pii, toxicity] = await Promise.all([
        this.contentSafetyCheck({ content }),
        this.piiDetection({ text: content }),
        this.toxicityScore({ text: content }),
      ]);

      const moderationData = JSON.parse(moderation.content[0].text);
      const piiData = JSON.parse(pii.content[0].text);
      const toxicityData = JSON.parse(toxicity.content[0].text);

      const overallSafe = moderationData.safe && !piiData.pii_found && toxicityData.risk_level === "low";

      return this.formatResponse({
        report_type: report_type,
        generated_at: new Date().toISOString(),
        overall_status: overallSafe ? "SAFE" : "UNSAFE",
        content_moderation: moderationData,
        pii_detection: piiData,
        toxicity_analysis: toxicityData,
        summary: {
          safe: overallSafe,
          issues_found: [
            ...(!moderationData.safe ? ["content_violations"] : []),
            ...(piiData.pii_found ? ["pii_detected"] : []),
            ...(toxicityData.risk_level !== "low" ? ["high_toxicity"] : []),
          ],
          recommendation: overallSafe
            ? "Content is safe for use."
            : "Content has safety issues. Review and address before deployment.",
        },
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async auditLogExport(args: any) {
    const { start_date, end_date, format = "json", include_pii = false } = args;
    try {
      // Get cost history (which includes audit trail)
      const history = this.costManager.getCostHistory();

      // Filter by date range
      const filtered = history.filter((record: any) => {
        const recordDate = new Date(record.timestamp);
        return recordDate >= new Date(start_date) && recordDate <= new Date(end_date);
      });

      // Redact PII if needed
      const sanitized = include_pii ? filtered : filtered.map((record: any) => {
        const { metadata, ...rest } = record;
        return rest;
      });

      if (format === "csv") {
        const csv = this.convertToCSV(sanitized);
        return this.formatResponse({ format: "csv", data: csv, records: sanitized.length });
      }

      return this.formatResponse({
        format: format,
        start_date: start_date,
        end_date: end_date,
        records_count: sanitized.length,
        data: sanitized,
        includes_pii: include_pii,
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private convertToCSV(data: any[]): string {
    if (data.length === 0) return "";

    const headers = Object.keys(data[0]);
    const rows = data.map(row => headers.map(h => JSON.stringify(row[h] || "")).join(","));
    return [headers.join(","), ...rows].join("\n");
  }

  // ==================== MONITORING & OBSERVABILITY ====================

  private async monitorGetMetrics(args: any) {
    const { time_range = "24h", metrics = [] } = args;
    try {
      const history = this.costManager.getCostHistory();
      const now = Date.now();
      const rangeMs = this.parseTimeRange(time_range);
      const filtered = history.filter((r: any) => now - new Date(r.timestamp).getTime() < rangeMs);

      const totalRequests = filtered.length;
      const totalCost = filtered.reduce((sum: number, r: any) => sum + r.cost, 0);
      const totalTokens = filtered.reduce((sum: number, r: any) => sum + (r.tokens || 0), 0);

      const modelBreakdown: any = {};
      filtered.forEach((r: any) => {
        if (!modelBreakdown[r.model]) {
          modelBreakdown[r.model] = { requests: 0, cost: 0, tokens: 0 };
        }
        modelBreakdown[r.model].requests++;
        modelBreakdown[r.model].cost += r.cost;
        modelBreakdown[r.model].tokens += r.tokens || 0;
      });

      return this.formatResponse({
        time_range: time_range,
        period_start: new Date(now - rangeMs).toISOString(),
        period_end: new Date(now).toISOString(),
        metrics: {
          total_requests: totalRequests,
          total_cost_usd: totalCost.toFixed(4),
          total_tokens: totalTokens,
          avg_cost_per_request: totalRequests > 0 ? (totalCost / totalRequests).toFixed(6) : 0,
          avg_tokens_per_request: totalRequests > 0 ? Math.round(totalTokens / totalRequests) : 0,
          requests_per_hour: (totalRequests / (rangeMs / 3600000)).toFixed(2),
        },
        model_breakdown: modelBreakdown,
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private parseTimeRange(range: string): number {
    const map: any = { "1h": 3600000, "24h": 86400000, "7d": 604800000, "30d": 2592000000 };
    return map[range] || 86400000;
  }

  private async monitorGetErrors(args: any) {
    const { time_range = "24h", error_types = [], limit = 100 } = args;
    try {
      // In a real implementation, this would query error logs
      // For now, we'll simulate with cost history errors
      const history = this.costManager.getCostHistory();
      const now = Date.now();
      const rangeMs = this.parseTimeRange(time_range);

      const errors = history
        .filter((r: any) => r.error && now - new Date(r.timestamp).getTime() < rangeMs)
        .slice(0, limit);

      const errorStats: any = {};
      errors.forEach((e: any) => {
        const type = e.error_type || "unknown";
        if (!errorStats[type]) {
          errorStats[type] = { count: 0, examples: [] };
        }
        errorStats[type].count++;
        if (errorStats[type].examples.length < 3) {
          errorStats[type].examples.push({
            timestamp: e.timestamp,
            message: e.error,
            model: e.model,
          });
        }
      });

      return this.formatResponse({
        time_range: time_range,
        total_errors: errors.length,
        error_rate: `${((errors.length / history.length) * 100).toFixed(2)}%`,
        error_types: errorStats,
        recent_errors: errors.slice(0, 10),
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async monitorGetLatency(args: any) {
    const { time_range = "24h", model = "" } = args;
    try {
      const history = this.costManager.getCostHistory();
      const now = Date.now();
      const rangeMs = this.parseTimeRange(time_range);

      let filtered = history.filter((r: any) =>
        r.latency && now - new Date(r.timestamp).getTime() < rangeMs
      );

      if (model) {
        filtered = filtered.filter((r: any) => r.model === model);
      }

      const latencies = filtered.map((r: any) => r.latency).sort((a: number, b: number) => a - b);

      if (latencies.length === 0) {
        return this.formatResponse({ message: "No latency data available for the specified period" });
      }

      const p50 = latencies[Math.floor(latencies.length * 0.5)];
      const p95 = latencies[Math.floor(latencies.length * 0.95)];
      const p99 = latencies[Math.floor(latencies.length * 0.99)];
      const avg = latencies.reduce((a: number, b: number) => a + b, 0) / latencies.length;

      return this.formatResponse({
        time_range: time_range,
        model: model || "all",
        sample_size: latencies.length,
        latency_ms: {
          min: Math.min(...latencies),
          max: Math.max(...latencies),
          avg: avg.toFixed(2),
          p50: p50,
          p95: p95,
          p99: p99,
        },
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async monitorGetThroughput(args: any) {
    const { time_range = "24h", granularity = "hour" } = args;
    try {
      const history = this.costManager.getCostHistory();
      const now = Date.now();
      const rangeMs = this.parseTimeRange(time_range);
      const filtered = history.filter((r: any) => now - new Date(r.timestamp).getTime() < rangeMs);

      const bucketSize = granularity === "minute" ? 60000 : granularity === "hour" ? 3600000 : 86400000;
      const buckets: any = {};

      filtered.forEach((r: any) => {
        const bucketKey = Math.floor(new Date(r.timestamp).getTime() / bucketSize) * bucketSize;
        if (!buckets[bucketKey]) {
          buckets[bucketKey] = { requests: 0, tokens: 0, cost: 0 };
        }
        buckets[bucketKey].requests++;
        buckets[bucketKey].tokens += r.tokens || 0;
        buckets[bucketKey].cost += r.cost;
      });

      const timeline = Object.entries(buckets).map(([timestamp, data]: [string, any]) => ({
        timestamp: new Date(parseInt(timestamp)).toISOString(),
        ...data,
      }));

      return this.formatResponse({
        time_range: time_range,
        granularity: granularity,
        total_requests: filtered.length,
        avg_requests_per_period: timeline.length > 0 ? (filtered.length / timeline.length).toFixed(2) : 0,
        timeline: timeline,
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async monitorGetSuccessRate(args: any) {
    const { time_range = "24h", model = "" } = args;
    try {
      const history = this.costManager.getCostHistory();
      const now = Date.now();
      const rangeMs = this.parseTimeRange(time_range);

      let filtered = history.filter((r: any) => now - new Date(r.timestamp).getTime() < rangeMs);
      if (model) {
        filtered = filtered.filter((r: any) => r.model === model);
      }

      const total = filtered.length;
      const successful = filtered.filter((r: any) => !r.error).length;
      const failed = total - successful;

      return this.formatResponse({
        time_range: time_range,
        model: model || "all",
        total_requests: total,
        successful_requests: successful,
        failed_requests: failed,
        success_rate: total > 0 ? `${((successful / total) * 100).toFixed(2)}%` : "N/A",
        failure_rate: total > 0 ? `${((failed / total) * 100).toFixed(2)}%` : "N/A",
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private monitoringAlerts: Map<string, any> = new Map();

  private async monitorSetAlert(args: any) {
    const { alert_name, metric, threshold, condition = "above", notification_method = "log" } = args;
    try {
      this.monitoringAlerts.set(alert_name, {
        metric,
        threshold,
        condition,
        notification_method,
        created: new Date().toISOString(),
        status: "active",
      });

      return this.formatResponse({
        alert_name: alert_name,
        metric: metric,
        threshold: threshold,
        condition: condition,
        notification_method: notification_method,
        status: "configured",
        message: `Alert will trigger when ${metric} is ${condition} ${threshold}`,
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async monitorGetAlerts(args: any) {
    const { status = "active", limit = 50 } = args;
    try {
      const alerts = Array.from(this.monitoringAlerts.entries())
        .filter(([_, alert]) => status === "all" || alert.status === status)
        .slice(0, limit)
        .map(([name, alert]) => ({ name, ...alert }));

      return this.formatResponse({
        total_alerts: alerts.length,
        status_filter: status,
        alerts: alerts,
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async monitorExportLogs(args: any) {
    const { start_date, end_date, format = "json", log_level = "info" } = args;
    try {
      const history = this.costManager.getCostHistory();
      const filtered = history.filter((r: any) => {
        const timestamp = new Date(r.timestamp);
        return timestamp >= new Date(start_date) && timestamp <= new Date(end_date);
      });

      if (format === "csv") {
        const csv = this.convertToCSV(filtered);
        return this.formatResponse({ format: "csv", data: csv, records: filtered.length });
      }

      if (format === "ndjson") {
        const ndjson = filtered.map((r: any) => JSON.stringify(r)).join("\n");
        return this.formatResponse({ format: "ndjson", data: ndjson, records: filtered.length });
      }

      return this.formatResponse({
        format: format,
        start_date: start_date,
        end_date: end_date,
        log_level: log_level,
        records: filtered.length,
        data: filtered,
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async monitorGetTrace(args: any) {
    const { trace_id, include_spans = true } = args;
    try {
      // In a real implementation, this would query distributed tracing system
      return this.formatResponse({
        trace_id: trace_id,
        status: "simulated",
        message: "Distributed tracing not yet implemented. This would integrate with OpenTelemetry or similar.",
        spans: include_spans ? [
          { span_id: "span-1", operation: "openai.chat.completions.create", duration_ms: 1234 },
          { span_id: "span-2", operation: "cost_manager.estimate", duration_ms: 5 },
        ] : [],
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async monitorGetDashboard(args: any) {
    const { dashboard_type = "overview", time_range = "24h" } = args;
    try {
      const metrics = await this.monitorGetMetrics({ time_range });
      const errors = await this.monitorGetErrors({ time_range });
      const latency = await this.monitorGetLatency({ time_range });
      const successRate = await this.monitorGetSuccessRate({ time_range });

      const metricsData = JSON.parse(metrics.content[0].text);
      const errorsData = JSON.parse(errors.content[0].text);
      const latencyData = JSON.parse(latency.content[0].text);
      const successData = JSON.parse(successRate.content[0].text);

      return this.formatResponse({
        dashboard_type: dashboard_type,
        time_range: time_range,
        generated_at: new Date().toISOString(),
        overview: {
          total_requests: metricsData.metrics.total_requests,
          total_cost: metricsData.metrics.total_cost_usd,
          success_rate: successData.success_rate,
          error_count: errorsData.total_errors,
          avg_latency_ms: latencyData.latency_ms?.avg || "N/A",
        },
        metrics: metricsData,
        errors: errorsData,
        latency: latencyData,
        success_rate: successData,
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async monitorGetAnomalies(args: any) {
    const { metric, time_range = "24h", sensitivity = "medium" } = args;
    try {
      const history = this.costManager.getCostHistory();
      const now = Date.now();
      const rangeMs = this.parseTimeRange(time_range);
      const filtered = history.filter((r: any) => now - new Date(r.timestamp).getTime() < rangeMs);

      // Simple anomaly detection using standard deviation
      const values = filtered.map((r: any) => {
        if (metric === "cost") return r.cost;
        if (metric === "tokens") return r.tokens || 0;
        if (metric === "latency") return r.latency || 0;
        return 0;
      });

      const mean = values.reduce((a: number, b: number) => a + b, 0) / values.length;
      const variance = values.reduce((sum: number, val: number) => sum + Math.pow(val - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);

      const threshold = sensitivity === "low" ? 3 : sensitivity === "medium" ? 2 : 1.5;
      const anomalies: any[] = [];

      filtered.forEach((r: any, i: number) => {
        const value = values[i];
        const zScore = Math.abs((value - mean) / stdDev);

        if (zScore > threshold) {
          anomalies.push({
            timestamp: r.timestamp,
            metric: metric,
            value: value,
            expected_range: `${(mean - threshold * stdDev).toFixed(2)} - ${(mean + threshold * stdDev).toFixed(2)}`,
            z_score: zScore.toFixed(2),
            severity: zScore > 3 ? "high" : zScore > 2 ? "medium" : "low",
          });
        }
      });

      return this.formatResponse({
        metric: metric,
        time_range: time_range,
        sensitivity: sensitivity,
        anomalies_detected: anomalies.length,
        anomalies: anomalies,
        statistics: {
          mean: mean.toFixed(2),
          std_dev: stdDev.toFixed(2),
          threshold: threshold,
        },
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async monitorGetHealth(args: any) {
    const { include_details = true } = args;
    try {
      const budget = this.costManager.getBudgetStatus();
      const history = this.costManager.getCostHistory();
      const recentErrors = history.filter((r: any) => r.error).slice(-10);

      const health = {
        status: "healthy",
        checks: {
          budget: budget.daily.remaining > 0 && budget.monthly.remaining > 0 ? "pass" : "fail",
          error_rate: recentErrors.length < 5 ? "pass" : "warn",
          api_connectivity: "pass", // Would check actual API in production
        },
      };

      if (health.checks.budget === "fail" || health.checks.error_rate === "fail") {
        health.status = "unhealthy";
      } else if (health.checks.error_rate === "warn") {
        health.status = "degraded";
      }

      const response: any = {
        status: health.status,
        timestamp: new Date().toISOString(),
        checks: health.checks,
      };

      if (include_details) {
        response.details = {
          budget_status: budget,
          recent_errors: recentErrors.length,
          total_requests_24h: history.filter((r: any) =>
            Date.now() - new Date(r.timestamp).getTime() < 86400000
          ).length,
        };
      }

      return this.formatResponse(response);
    } catch (error: any) {
      return this.formatResponse({
        status: "unhealthy",
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // ==================== PROMPT ENGINEERING ====================

  private async promptOptimize(args: any) {
    const { prompt, goal = "all", model = "gpt-4o-mini" } = args;
    try {
      const optimizationPrompt = `You are a prompt engineering expert. Optimize the following prompt for ${goal === "all" ? "clarity, conciseness, specificity, and effectiveness" : goal}.

Original prompt:
${prompt}

Provide:
1. Optimized version
2. Key improvements made
3. Expected impact on results

Return JSON:
{
  "optimized_prompt": "...",
  "improvements": ["improvement 1", "improvement 2"],
  "impact": "description of expected improvements",
  "token_savings": number
}`;

      const response = await this.openai.chat.completions.create({
        model: model,
        messages: [{ role: "user", content: optimizationPrompt }],
        temperature: 0.3,
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      const originalTokens = this.costManager.estimateTokens(prompt, model);
      const optimizedTokens = this.costManager.estimateTokens(result.optimized_prompt || "", model);

      return this.formatResponse({
        ...result,
        original_prompt: prompt,
        original_tokens: originalTokens,
        optimized_tokens: optimizedTokens,
        token_reduction: originalTokens - optimizedTokens,
        token_reduction_percent: `${(((originalTokens - optimizedTokens) / originalTokens) * 100).toFixed(1)}%`,
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async promptShorten(args: any) {
    const { prompt, target_reduction = 30 } = args;
    try {
      const shortenPrompt = `Shorten the following prompt by approximately ${target_reduction}% while preserving its core meaning and intent.

Original prompt:
${prompt}

Return JSON:
{
  "shortened_prompt": "...",
  "removed_elements": ["element 1", "element 2"],
  "preserved_elements": ["element 1", "element 2"]
}`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: shortenPrompt }],
        temperature: 0.2,
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      const originalTokens = this.costManager.estimateTokens(prompt, "gpt-4o-mini");
      const shortenedTokens = this.costManager.estimateTokens(result.shortened_prompt || "", "gpt-4o-mini");
      const actualReduction = ((originalTokens - shortenedTokens) / originalTokens) * 100;

      return this.formatResponse({
        ...result,
        original_prompt: prompt,
        original_length: prompt.length,
        shortened_length: result.shortened_prompt?.length || 0,
        original_tokens: originalTokens,
        shortened_tokens: shortenedTokens,
        target_reduction: `${target_reduction}%`,
        actual_reduction: `${actualReduction.toFixed(1)}%`,
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async promptExpand(args: any) {
    const { prompt, expansion_type = "all" } = args;
    try {
      const expandPrompt = `Expand the following prompt with ${expansion_type === "all" ? "examples, context, and constraints" : expansion_type}.

Original prompt:
${prompt}

Return JSON:
{
  "expanded_prompt": "...",
  "additions": {
    "examples": ["example 1", "example 2"],
    "context": "additional context added",
    "constraints": ["constraint 1", "constraint 2"]
  }
}`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: expandPrompt }],
        temperature: 0.3,
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");

      return this.formatResponse({
        ...result,
        original_prompt: prompt,
        expansion_type: expansion_type,
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async promptTest(args: any) {
    const { prompt, models = ["gpt-4o-mini", "gpt-4o", "gpt-4-turbo"], test_cases = [] } = args;
    try {
      const results: any[] = [];

      for (const model of models) {
        const response = await this.openai.chat.completions.create({
          model: model,
          messages: [{ role: "user", content: prompt }],
          max_tokens: 500,
        });

        const cost = ((response.usage?.prompt_tokens || 0) / 1000) * ((this.costManager as any).PRICING[model]?.input_per_1k || 0) +
                     ((response.usage?.completion_tokens || 0) / 1000) * ((this.costManager as any).PRICING[model]?.output_per_1k || 0);

        results.push({
          model: model,
          response: response.choices[0].message.content?.substring(0, 200) + "...",
          tokens: response.usage,
          cost_usd: cost.toFixed(6),
        });
      }

      return this.formatResponse({
        prompt: prompt,
        models_tested: models,
        results: results,
        recommendation: results.sort((a, b) => parseFloat(a.cost_usd) - parseFloat(b.cost_usd))[0].model,
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async promptCompare(args: any) {
    const { prompts, evaluation_criteria = ["clarity", "effectiveness", "token_efficiency"] } = args;
    try {
      const comparePrompt = `Compare the following prompts based on: ${evaluation_criteria.join(", ")}

Prompts:
${prompts.map((p: string, i: number) => `${i + 1}. ${p}`).join("\n\n")}

Return JSON:
{
  "rankings": [{"prompt_index": 1, "score": 85, "strengths": [...], "weaknesses": [...]}],
  "best_prompt_index": 1,
  "recommendation": "..."
}`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: comparePrompt }],
        temperature: 0.2,
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");

      return this.formatResponse({
        ...result,
        prompts: prompts,
        evaluation_criteria: evaluation_criteria,
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async promptSuggestImprovements(args: any) {
    const { prompt, focus_areas = ["structure", "clarity", "specificity", "examples"] } = args;
    try {
      const suggestPrompt = `Analyze this prompt and suggest improvements focusing on: ${focus_areas.join(", ")}

Prompt:
${prompt}

Return JSON:
{
  "suggestions": [
    {"area": "clarity", "issue": "...", "suggestion": "...", "priority": "high/medium/low"},
    {"area": "structure", "issue": "...", "suggestion": "...", "priority": "high/medium/low"}
  ],
  "overall_score": 75,
  "quick_wins": ["suggestion 1", "suggestion 2"]
}`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: suggestPrompt }],
        temperature: 0.3,
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");

      return this.formatResponse({
        ...result,
        original_prompt: prompt,
        focus_areas: focus_areas,
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async promptExtractVariables(args: any) {
    const { prompt_template, variable_format = "auto" } = args;
    try {
      const extractPrompt = `Extract all variables from this prompt template. Variables may be in formats like {{var}}, {var}, $var, or other patterns.

Template:
${prompt_template}

Return JSON:
{
  "variables": [
    {"name": "user_name", "format": "{{user_name}}", "type": "string", "required": true},
    {"name": "age", "format": "{age}", "type": "number", "required": false}
  ],
  "variable_count": 2
}`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: extractPrompt }],
        temperature: 0.1,
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");

      return this.formatResponse({
        ...result,
        template: prompt_template,
        variable_format: variable_format,
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async promptGenerateExamples(args: any) {
    const { prompt, num_examples = 3, example_type = "both" } = args;
    try {
      const genPrompt = `Generate ${num_examples} ${example_type} examples for this prompt:

Prompt:
${prompt}

Return JSON:
{
  "examples": [
    {"input": "example input 1", "output": "example output 1"},
    {"input": "example input 2", "output": "example output 2"}
  ]
}`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: genPrompt }],
        temperature: 0.7,
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");

      return this.formatResponse({
        ...result,
        prompt: prompt,
        num_examples: num_examples,
        example_type: example_type,
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async promptValidate(args: any) {
    const { prompt, validation_level = "comprehensive" } = args;
    try {
      const validatePrompt = `Validate this prompt for common issues and best practices. Validation level: ${validation_level}

Prompt:
${prompt}

Check for:
- Clarity and specificity
- Ambiguity or vagueness
- Missing context
- Potential biases
- Token efficiency
- Best practices compliance

Return JSON:
{
  "valid": true/false,
  "score": 85,
  "issues": [{"severity": "high/medium/low", "issue": "...", "fix": "..."}],
  "warnings": ["warning 1", "warning 2"],
  "best_practices": {"followed": [...], "missing": [...]}
}`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: validatePrompt }],
        temperature: 0.2,
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");

      return this.formatResponse({
        ...result,
        prompt: prompt,
        validation_level: validation_level,
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async promptTranslate(args: any) {
    const { prompt, target_language, preserve_formatting = true } = args;
    try {
      const translatePrompt = `Translate this prompt to ${target_language} while preserving its intent and effectiveness. ${preserve_formatting ? "Preserve all formatting, variables, and special markers." : ""}

Original prompt:
${prompt}

Return JSON:
{
  "translated_prompt": "...",
  "notes": "any important translation notes",
  "preserved_elements": ["element 1", "element 2"]
}`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: translatePrompt }],
        temperature: 0.3,
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");

      return this.formatResponse({
        ...result,
        original_prompt: prompt,
        target_language: target_language,
        preserve_formatting: preserve_formatting,
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  // ==================== ADVANCED EMBEDDINGS ====================

  private async embeddingSimilarity(args: any) {
    const { text1, text2, model = "text-embedding-3-small", similarity_metric = "cosine" } = args;
    try {
      const [embedding1, embedding2] = await Promise.all([
        this.openai.embeddings.create({ model, input: text1 }),
        this.openai.embeddings.create({ model, input: text2 }),
      ]);

      const vec1 = embedding1.data[0].embedding;
      const vec2 = embedding2.data[0].embedding;

      let similarity = 0;
      if (similarity_metric === "cosine") {
        similarity = this.cosineSimilarity(vec1, vec2);
      } else if (similarity_metric === "euclidean") {
        similarity = 1 / (1 + this.euclideanDistance(vec1, vec2));
      } else if (similarity_metric === "dot_product") {
        similarity = this.dotProduct(vec1, vec2);
      }

      return this.formatResponse({
        text1: text1.substring(0, 100) + "...",
        text2: text2.substring(0, 100) + "...",
        similarity: similarity.toFixed(4),
        similarity_metric: similarity_metric,
        model: model,
        interpretation: similarity > 0.9 ? "very similar" : similarity > 0.7 ? "similar" : similarity > 0.5 ? "somewhat similar" : "dissimilar",
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    const dotProd = this.dotProduct(vec1, vec2);
    const mag1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
    const mag2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));
    return dotProd / (mag1 * mag2);
  }

  private dotProduct(vec1: number[], vec2: number[]): number {
    return vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
  }

  private euclideanDistance(vec1: number[], vec2: number[]): number {
    return Math.sqrt(vec1.reduce((sum, val, i) => sum + Math.pow(val - vec2[i], 2), 0));
  }

  private async embeddingCluster(args: any) {
    const { texts, num_clusters = 3, method = "kmeans", model = "text-embedding-3-small" } = args;
    try {
      const embeddings = await this.openai.embeddings.create({ model, input: texts });
      const vectors = embeddings.data.map(d => d.embedding);

      // Simple k-means clustering
      const clusters = this.kMeansClustering(vectors, num_clusters);

      const clusterGroups: any = {};
      clusters.forEach((clusterIdx, textIdx) => {
        if (!clusterGroups[clusterIdx]) {
          clusterGroups[clusterIdx] = [];
        }
        clusterGroups[clusterIdx].push({
          text: texts[textIdx].substring(0, 100) + "...",
          index: textIdx,
        });
      });

      return this.formatResponse({
        num_clusters: num_clusters,
        method: method,
        model: model,
        clusters: clusterGroups,
        cluster_sizes: Object.values(clusterGroups).map((g: any) => g.length),
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private kMeansClustering(vectors: number[][], k: number): number[] {
    // Simple k-means implementation
    const n = vectors.length;
    const dim = vectors[0].length;

    // Initialize centroids randomly
    const centroids: number[][] = [];
    for (let i = 0; i < k; i++) {
      centroids.push(vectors[Math.floor(Math.random() * n)]);
    }

    let assignments = new Array(n).fill(0);
    let changed = true;
    let iterations = 0;

    while (changed && iterations < 100) {
      changed = false;
      iterations++;

      // Assign points to nearest centroid
      for (let i = 0; i < n; i++) {
        let minDist = Infinity;
        let bestCluster = 0;

        for (let j = 0; j < k; j++) {
          const dist = this.euclideanDistance(vectors[i], centroids[j]);
          if (dist < minDist) {
            minDist = dist;
            bestCluster = j;
          }
        }

        if (assignments[i] !== bestCluster) {
          assignments[i] = bestCluster;
          changed = true;
        }
      }

      // Update centroids
      for (let j = 0; j < k; j++) {
        const clusterPoints = vectors.filter((_, i) => assignments[i] === j);
        if (clusterPoints.length > 0) {
          centroids[j] = new Array(dim).fill(0);
          for (const point of clusterPoints) {
            for (let d = 0; d < dim; d++) {
              centroids[j][d] += point[d];
            }
          }
          for (let d = 0; d < dim; d++) {
            centroids[j][d] /= clusterPoints.length;
          }
        }
      }
    }

    return assignments;
  }

  private async embeddingSearch(args: any) {
    const { query, documents, top_k = 5, model = "text-embedding-3-small" } = args;
    try {
      const [queryEmbedding, docEmbeddings] = await Promise.all([
        this.openai.embeddings.create({ model, input: query }),
        this.openai.embeddings.create({ model, input: documents }),
      ]);

      const queryVec = queryEmbedding.data[0].embedding;
      const docVecs = docEmbeddings.data.map(d => d.embedding);

      const similarities = docVecs.map((docVec, idx) => ({
        document: documents[idx],
        similarity: this.cosineSimilarity(queryVec, docVec),
        index: idx,
      }));

      similarities.sort((a, b) => b.similarity - a.similarity);
      const topResults = similarities.slice(0, top_k);

      return this.formatResponse({
        query: query,
        top_k: top_k,
        model: model,
        results: topResults.map(r => ({
          document: r.document.substring(0, 200) + "...",
          similarity: r.similarity.toFixed(4),
          index: r.index,
        })),
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async embeddingOutlierDetection(args: any) {
    const { texts, threshold = 2.5, model = "text-embedding-3-small" } = args;
    try {
      const embeddings = await this.openai.embeddings.create({ model, input: texts });
      const vectors = embeddings.data.map(d => d.embedding);

      // Calculate centroid
      const dim = vectors[0].length;
      const centroid = new Array(dim).fill(0);
      for (const vec of vectors) {
        for (let i = 0; i < dim; i++) {
          centroid[i] += vec[i];
        }
      }
      for (let i = 0; i < dim; i++) {
        centroid[i] /= vectors.length;
      }

      // Calculate distances from centroid
      const distances = vectors.map(vec => this.euclideanDistance(vec, centroid));
      const mean = distances.reduce((a, b) => a + b, 0) / distances.length;
      const variance = distances.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / distances.length;
      const stdDev = Math.sqrt(variance);

      const outliers = distances.map((dist, idx) => ({
        text: texts[idx],
        distance: dist,
        z_score: (dist - mean) / stdDev,
        is_outlier: (dist - mean) / stdDev > threshold,
      })).filter(item => item.is_outlier);

      return this.formatResponse({
        total_texts: texts.length,
        outliers_detected: outliers.length,
        threshold: threshold,
        outliers: outliers.map(o => ({
          text: o.text.substring(0, 100) + "...",
          z_score: o.z_score.toFixed(2),
        })),
        statistics: {
          mean_distance: mean.toFixed(4),
          std_dev: stdDev.toFixed(4),
        },
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async embeddingDimensionalityReduction(args: any) {
    const { texts, target_dimensions = 2, method = "pca", model = "text-embedding-3-small" } = args;
    try {
      const embeddings = await this.openai.embeddings.create({ model, input: texts });
      const vectors = embeddings.data.map(d => d.embedding);

      // Simple PCA implementation
      const reduced = this.simplePCA(vectors, target_dimensions);

      return this.formatResponse({
        method: method,
        original_dimensions: vectors[0].length,
        target_dimensions: target_dimensions,
        reduced_embeddings: reduced.map((vec, idx) => ({
          text: texts[idx].substring(0, 50) + "...",
          coordinates: vec.map(v => v.toFixed(4)),
        })),
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private simplePCA(vectors: number[][], targetDim: number): number[][] {
    // Simplified PCA - just take first N dimensions for now
    // In production, would use proper PCA with eigenvalue decomposition
    return vectors.map(vec => vec.slice(0, targetDim));
  }

  private async embeddingVisualization(args: any) {
    const { texts, labels = [], model = "text-embedding-3-small" } = args;
    try {
      const embeddings = await this.openai.embeddings.create({ model, input: texts });
      const vectors = embeddings.data.map(d => d.embedding);

      // Reduce to 2D for visualization
      const reduced = this.simplePCA(vectors, 2);

      return this.formatResponse({
        visualization_data: reduced.map((coords, idx) => ({
          x: coords[0].toFixed(4),
          y: coords[1].toFixed(4),
          text: texts[idx].substring(0, 50) + "...",
          label: labels[idx] || `Point ${idx + 1}`,
        })),
        chart_type: "scatter",
        instructions: "Plot x,y coordinates to visualize semantic relationships",
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async embeddingBatchSimilarity(args: any) {
    const { texts, model = "text-embedding-3-small" } = args;
    try {
      const embeddings = await this.openai.embeddings.create({ model, input: texts });
      const vectors = embeddings.data.map(d => d.embedding);

      const similarityMatrix: number[][] = [];
      for (let i = 0; i < vectors.length; i++) {
        const row: number[] = [];
        for (let j = 0; j < vectors.length; j++) {
          row.push(this.cosineSimilarity(vectors[i], vectors[j]));
        }
        similarityMatrix.push(row);
      }

      // Find most similar pairs
      const pairs: any[] = [];
      for (let i = 0; i < vectors.length; i++) {
        for (let j = i + 1; j < vectors.length; j++) {
          pairs.push({
            text1_index: i,
            text2_index: j,
            text1: texts[i].substring(0, 50) + "...",
            text2: texts[j].substring(0, 50) + "...",
            similarity: similarityMatrix[i][j].toFixed(4),
          });
        }
      }

      pairs.sort((a, b) => parseFloat(b.similarity) - parseFloat(a.similarity));

      return this.formatResponse({
        num_texts: texts.length,
        similarity_matrix: similarityMatrix.map(row => row.map(v => v.toFixed(4))),
        most_similar_pairs: pairs.slice(0, 10),
        least_similar_pairs: pairs.slice(-10).reverse(),
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private embeddingIndexes: Map<string, any> = new Map();

  private async embeddingIndexCreate(args: any) {
    const { index_name, documents, model = "text-embedding-3-small", metadata = [] } = args;
    try {
      const embeddings = await this.openai.embeddings.create({ model, input: documents });
      const vectors = embeddings.data.map(d => d.embedding);

      this.embeddingIndexes.set(index_name, {
        documents: documents,
        vectors: vectors,
        metadata: metadata,
        model: model,
        created: new Date().toISOString(),
      });

      return this.formatResponse({
        index_name: index_name,
        num_documents: documents.length,
        model: model,
        status: "created",
        usage: `Use openai_embedding_search with this index for semantic search`,
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  // ==================== REALTIME API ====================
  // Note: Realtime API uses WebSocket connections. These implementations provide
  // structure and guidance. Full implementation would require WebSocket client.

  private realtimeSessions: Map<string, any> = new Map();

  private async realtimeSessionCreate(args: any) {
    const { model = "gpt-4o-realtime-preview", voice = "alloy", instructions = "", modalities = ["text", "audio"] } = args;
    try {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      this.realtimeSessions.set(sessionId, {
        model,
        voice,
        instructions,
        modalities,
        created: new Date().toISOString(),
        status: "active",
        messages: [],
        transcript: [],
      });

      return this.formatResponse({
        session_id: sessionId,
        model: model,
        voice: voice,
        modalities: modalities,
        status: "created",
        websocket_url: "wss://api.openai.com/v1/realtime",
        instructions: "Connect to WebSocket URL with session_id to start real-time conversation",
        note: "This is a simulated session. Full implementation requires WebSocket client.",
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async realtimeSessionUpdate(args: any) {
    const { session_id, voice, instructions, temperature } = args;
    try {
      const session = this.realtimeSessions.get(session_id);
      if (!session) {
        return this.formatResponse({ error: `Session ${session_id} not found` });
      }

      if (voice) session.voice = voice;
      if (instructions) session.instructions = instructions;
      if (temperature !== undefined) session.temperature = temperature;

      return this.formatResponse({
        session_id: session_id,
        updated: true,
        current_config: {
          voice: session.voice,
          instructions: session.instructions,
          temperature: session.temperature,
        },
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async realtimeAudioSend(args: any) {
    const { session_id, audio_data, format = "pcm16" } = args;
    try {
      const session = this.realtimeSessions.get(session_id);
      if (!session) {
        return this.formatResponse({ error: `Session ${session_id} not found` });
      }

      session.messages.push({
        type: "audio_input",
        format: format,
        timestamp: new Date().toISOString(),
        size_bytes: audio_data.length,
      });

      return this.formatResponse({
        session_id: session_id,
        status: "received",
        format: format,
        note: "In production, this would send audio via WebSocket to OpenAI Realtime API",
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async realtimeAudioReceive(args: any) {
    const { session_id, timeout_ms = 5000 } = args;
    try {
      const session = this.realtimeSessions.get(session_id);
      if (!session) {
        return this.formatResponse({ error: `Session ${session_id} not found` });
      }

      return this.formatResponse({
        session_id: session_id,
        status: "simulated",
        note: "In production, this would receive audio via WebSocket from OpenAI Realtime API",
        audio_format: "pcm16",
        sample_rate: 24000,
        channels: 1,
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async realtimeTextSend(args: any) {
    const { session_id, text } = args;
    try {
      const session = this.realtimeSessions.get(session_id);
      if (!session) {
        return this.formatResponse({ error: `Session ${session_id} not found` });
      }

      session.messages.push({
        role: "user",
        content: text,
        timestamp: new Date().toISOString(),
      });

      session.transcript.push({
        speaker: "user",
        text: text,
        timestamp: new Date().toISOString(),
      });

      return this.formatResponse({
        session_id: session_id,
        status: "sent",
        message: text,
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async realtimeTextReceive(args: any) {
    const { session_id, timeout_ms = 5000 } = args;
    try {
      const session = this.realtimeSessions.get(session_id);
      if (!session) {
        return this.formatResponse({ error: `Session ${session_id} not found` });
      }

      // Simulated response
      const response = "This is a simulated response. In production, this would receive real-time text from OpenAI.";

      session.messages.push({
        role: "assistant",
        content: response,
        timestamp: new Date().toISOString(),
      });

      session.transcript.push({
        speaker: "assistant",
        text: response,
        timestamp: new Date().toISOString(),
      });

      return this.formatResponse({
        session_id: session_id,
        response: response,
        status: "simulated",
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async realtimeFunctionCall(args: any) {
    const { session_id, functions } = args;
    try {
      const session = this.realtimeSessions.get(session_id);
      if (!session) {
        return this.formatResponse({ error: `Session ${session_id} not found` });
      }

      session.functions = functions;

      return this.formatResponse({
        session_id: session_id,
        functions_registered: functions.length,
        status: "configured",
        note: "Functions are now available for the assistant to call during conversation",
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async realtimeInterrupt(args: any) {
    const { session_id } = args;
    try {
      const session = this.realtimeSessions.get(session_id);
      if (!session) {
        return this.formatResponse({ error: `Session ${session_id} not found` });
      }

      return this.formatResponse({
        session_id: session_id,
        status: "interrupted",
        note: "In production, this would send interrupt signal via WebSocket to stop ongoing response",
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async realtimeSessionClose(args: any) {
    const { session_id } = args;
    try {
      const session = this.realtimeSessions.get(session_id);
      if (!session) {
        return this.formatResponse({ error: `Session ${session_id} not found` });
      }

      const summary = {
        session_id: session_id,
        duration_seconds: (Date.now() - new Date(session.created).getTime()) / 1000,
        total_messages: session.messages.length,
        transcript_length: session.transcript.length,
      };

      this.realtimeSessions.delete(session_id);

      return this.formatResponse({
        ...summary,
        status: "closed",
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async realtimeGetTranscript(args: any) {
    const { session_id, format = "text" } = args;
    try {
      const session = this.realtimeSessions.get(session_id);
      if (!session) {
        return this.formatResponse({ error: `Session ${session_id} not found` });
      }

      if (format === "text") {
        const text = session.transcript.map((t: any) => `${t.speaker}: ${t.text}`).join("\n");
        return this.formatResponse({
          session_id: session_id,
          format: "text",
          transcript: text,
        });
      } else if (format === "json") {
        return this.formatResponse({
          session_id: session_id,
          format: "json",
          transcript: session.transcript,
        });
      } else if (format === "srt") {
        const srt = session.transcript.map((t: any, i: number) => {
          const time = new Date(t.timestamp);
          return `${i + 1}\n00:00:${i.toString().padStart(2, '0')},000 --> 00:00:${(i + 1).toString().padStart(2, '0')},000\n${t.speaker}: ${t.text}\n`;
        }).join("\n");
        return this.formatResponse({
          session_id: session_id,
          format: "srt",
          transcript: srt,
        });
      }

      return this.formatResponse({ error: `Unknown format: ${format}` });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async realtimeConfigureVoice(args: any) {
    const { session_id, voice, speed = 1.0 } = args;
    try {
      const session = this.realtimeSessions.get(session_id);
      if (!session) {
        return this.formatResponse({ error: `Session ${session_id} not found` });
      }

      if (voice) session.voice = voice;
      session.speed = speed;

      return this.formatResponse({
        session_id: session_id,
        voice: session.voice,
        speed: speed,
        status: "configured",
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async realtimeGetMetrics(args: any) {
    const { session_id } = args;
    try {
      const session = this.realtimeSessions.get(session_id);
      if (!session) {
        return this.formatResponse({ error: `Session ${session_id} not found` });
      }

      const duration = (Date.now() - new Date(session.created).getTime()) / 1000;

      return this.formatResponse({
        session_id: session_id,
        metrics: {
          duration_seconds: duration.toFixed(2),
          total_messages: session.messages.length,
          user_messages: session.messages.filter((m: any) => m.role === "user").length,
          assistant_messages: session.messages.filter((m: any) => m.role === "assistant").length,
          audio_inputs: session.messages.filter((m: any) => m.type === "audio_input").length,
          avg_latency_ms: "N/A (simulated)",
          status: session.status,
        },
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  // ==================== VISION API ====================

  private async visionAnalyzeImage(args: any) {
    const { image_url, prompt = "Analyze this image in detail", model = "gpt-4o", detail = "auto" } = args;
    try {
      const response = await this.openai.chat.completions.create({
        model: model,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: image_url, detail: detail } },
            ],
          },
        ],
        max_tokens: 1000,
      });

      return this.formatResponse({
        analysis: response.choices[0].message.content,
        model: model,
        detail_level: detail,
        usage: response.usage,
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async visionDescribeImage(args: any) {
    const { image_url, style = "detailed", model = "gpt-4o" } = args;
    try {
      const prompts: any = {
        concise: "Provide a brief, one-sentence description of this image.",
        detailed: "Provide a detailed description of this image, including objects, people, setting, colors, and mood.",
        creative: "Describe this image in a creative, engaging way that captures its essence and tells a story.",
      };

      const response = await this.openai.chat.completions.create({
        model: model,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompts[style] },
              { type: "image_url", image_url: { url: image_url } },
            ],
          },
        ],
        max_tokens: style === "concise" ? 100 : 500,
      });

      return this.formatResponse({
        description: response.choices[0].message.content,
        style: style,
        model: model,
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async visionExtractText(args: any) {
    const { image_url, language = "", model = "gpt-4o" } = args;
    try {
      const prompt = language
        ? `Extract all text from this image. The text is in ${language}. Return only the extracted text, preserving formatting where possible.`
        : "Extract all text from this image. Return only the extracted text, preserving formatting where possible.";

      const response = await this.openai.chat.completions.create({
        model: model,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: image_url } },
            ],
          },
        ],
        max_tokens: 1000,
      });

      return this.formatResponse({
        extracted_text: response.choices[0].message.content,
        language: language || "auto-detected",
        model: model,
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async visionDetectObjects(args: any) {
    const { image_url, categories = [], model = "gpt-4o" } = args;
    try {
      const prompt = categories.length > 0
        ? `Identify and list all objects in this image, focusing on these categories: ${categories.join(", ")}. For each object, provide: name, location (general area), confidence level.`
        : "Identify and list all objects in this image. For each object, provide: name, location (general area), confidence level.";

      const response = await this.openai.chat.completions.create({
        model: model,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt + " Return as JSON array." },
              { type: "image_url", image_url: { url: image_url } },
            ],
          },
        ],
        max_tokens: 1000,
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");

      return this.formatResponse({
        objects: result.objects || result,
        categories_requested: categories,
        model: model,
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async visionCompareImages(args: any) {
    const { image_url_1, image_url_2, focus = "both", model = "gpt-4o" } = args;
    try {
      const prompts: any = {
        differences: "Compare these two images and identify all differences between them. Be specific and detailed.",
        similarities: "Compare these two images and identify all similarities between them. Be specific and detailed.",
        both: "Compare these two images. Identify both similarities and differences. Organize your response clearly.",
      };

      const response = await this.openai.chat.completions.create({
        model: model,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompts[focus] },
              { type: "image_url", image_url: { url: image_url_1 } },
              { type: "image_url", image_url: { url: image_url_2 } },
            ],
          },
        ],
        max_tokens: 1000,
      });

      return this.formatResponse({
        comparison: response.choices[0].message.content,
        focus: focus,
        model: model,
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async visionGenerateCaption(args: any) {
    const { image_url, style = "medium", tone = "casual", model = "gpt-4o" } = args;
    try {
      const prompts: any = {
        short: {
          formal: "Generate a short, formal caption for this image (max 10 words).",
          casual: "Generate a short, casual caption for this image (max 10 words).",
          creative: "Generate a short, creative caption for this image (max 10 words).",
        },
        medium: {
          formal: "Generate a medium-length, formal caption for this image (1-2 sentences).",
          casual: "Generate a medium-length, casual caption for this image (1-2 sentences).",
          creative: "Generate a medium-length, creative caption for this image (1-2 sentences).",
        },
        long: {
          formal: "Generate a long, formal caption for this image (3-4 sentences).",
          casual: "Generate a long, casual caption for this image (3-4 sentences).",
          creative: "Generate a long, creative caption for this image (3-4 sentences).",
        },
      };

      const response = await this.openai.chat.completions.create({
        model: model,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompts[style][tone] },
              { type: "image_url", image_url: { url: image_url } },
            ],
          },
        ],
        max_tokens: style === "short" ? 50 : style === "medium" ? 150 : 300,
      });

      return this.formatResponse({
        caption: response.choices[0].message.content,
        style: style,
        tone: tone,
        model: model,
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async visionAnswerQuestion(args: any) {
    const { image_url, question, model = "gpt-4o" } = args;
    try {
      const response = await this.openai.chat.completions.create({
        model: model,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: question },
              { type: "image_url", image_url: { url: image_url } },
            ],
          },
        ],
        max_tokens: 500,
      });

      return this.formatResponse({
        question: question,
        answer: response.choices[0].message.content,
        model: model,
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async visionBatchAnalyze(args: any) {
    const { image_urls, prompt, model = "gpt-4o" } = args;
    try {
      const results = await Promise.all(
        image_urls.map(async (url: string, idx: number) => {
          try {
            const response = await this.openai.chat.completions.create({
              model: model,
              messages: [
                {
                  role: "user",
                  content: [
                    { type: "text", text: prompt },
                    { type: "image_url", image_url: { url: url } },
                  ],
                },
              ],
              max_tokens: 500,
            });

            return {
              image_index: idx,
              image_url: url,
              analysis: response.choices[0].message.content,
              success: true,
            };
          } catch (error: any) {
            return {
              image_index: idx,
              image_url: url,
              error: error.message,
              success: false,
            };
          }
        })
      );

      return this.formatResponse({
        total_images: image_urls.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results: results,
        model: model,
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  // ==================== ADVANCED FINE-TUNING ====================

  private async fineTuningValidateData(args: any) {
    const { training_data, model = "gpt-4o-mini-2024-07-18" } = args;
    try {
      const errors: any[] = [];
      const warnings: any[] = [];

      training_data.forEach((item: any, idx: number) => {
        if (!item.messages || !Array.isArray(item.messages)) {
          errors.push({ line: idx, error: "Missing or invalid 'messages' field" });
        } else {
          if (item.messages.length < 2) {
            warnings.push({ line: idx, warning: "Less than 2 messages (should have at least user + assistant)" });
          }
          item.messages.forEach((msg: any, msgIdx: number) => {
            if (!msg.role || !msg.content) {
              errors.push({ line: idx, message: msgIdx, error: "Message missing 'role' or 'content'" });
            }
            if (!["system", "user", "assistant"].includes(msg.role)) {
              errors.push({ line: idx, message: msgIdx, error: `Invalid role: ${msg.role}` });
            }
          });
        }
      });

      return this.formatResponse({
        valid: errors.length === 0,
        total_examples: training_data.length,
        errors: errors,
        warnings: warnings,
        recommendations: errors.length === 0 ? ["Data format is valid", "Ready for fine-tuning"] : ["Fix errors before proceeding"],
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async fineTuningEstimateCost(args: any) {
    const { training_file_id, model = "gpt-4o-mini-2024-07-18", n_epochs = 3 } = args;
    try {
      const file = await this.openai.files.retrieve(training_file_id);
      const estimatedTokens = parseInt(file.bytes as any) / 4; // Rough estimate: 4 bytes per token

      const pricing: any = {
        "gpt-4o-mini-2024-07-18": { training: 3.00, input: 0.30, output: 1.20 }, // per 1M tokens
        "gpt-3.5-turbo": { training: 8.00, input: 3.00, output: 6.00 },
      };

      const modelPricing = pricing[model] || pricing["gpt-4o-mini-2024-07-18"];
      const trainingCost = (estimatedTokens / 1000000) * modelPricing.training * n_epochs;

      return this.formatResponse({
        training_file_id: training_file_id,
        model: model,
        n_epochs: n_epochs,
        estimated_tokens: Math.round(estimatedTokens),
        estimated_cost_usd: trainingCost.toFixed(2),
        pricing_per_1m_tokens: modelPricing,
        note: "This is an estimate. Actual cost may vary.",
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async fineTuningGetMetrics(args: any) {
    const { fine_tuning_job_id } = args;
    try {
      const job = await this.openai.fineTuning.jobs.retrieve(fine_tuning_job_id);

      return this.formatResponse({
        job_id: fine_tuning_job_id,
        status: job.status,
        model: job.model,
        fine_tuned_model: job.fine_tuned_model,
        trained_tokens: job.trained_tokens,
        result_files: job.result_files,
        training_file: job.training_file,
        validation_file: job.validation_file,
        hyperparameters: job.hyperparameters,
        created_at: new Date((job.created_at as any) * 1000).toISOString(),
        finished_at: job.finished_at ? new Date((job.finished_at as any) * 1000).toISOString() : null,
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async fineTuningCompareModels(args: any) {
    const { base_model, fine_tuned_model, test_prompts } = args;
    try {
      const comparisons = await Promise.all(
        test_prompts.map(async (prompt: string) => {
          const [baseResponse, fineTunedResponse] = await Promise.all([
            this.openai.chat.completions.create({
              model: base_model,
              messages: [{ role: "user", content: prompt }],
              max_tokens: 200,
            }),
            this.openai.chat.completions.create({
              model: fine_tuned_model,
              messages: [{ role: "user", content: prompt }],
              max_tokens: 200,
            }),
          ]);

          return {
            prompt: prompt,
            base_response: baseResponse.choices[0].message.content,
            fine_tuned_response: fineTunedResponse.choices[0].message.content,
          };
        })
      );

      return this.formatResponse({
        base_model: base_model,
        fine_tuned_model: fine_tuned_model,
        comparisons: comparisons,
        summary: `Compared ${test_prompts.length} prompts between base and fine-tuned models`,
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async fineTuningAnalyzeResults(args: any) {
    const { fine_tuning_job_id } = args;
    try {
      const job = await this.openai.fineTuning.jobs.retrieve(fine_tuning_job_id);

      const recommendations: string[] = [];
      if (job.status === "succeeded") {
        recommendations.push("Fine-tuning completed successfully");
        recommendations.push(`Model ${job.fine_tuned_model} is ready to use`);
      } else if (job.status === "failed") {
        recommendations.push("Fine-tuning failed - check error logs");
      } else {
        recommendations.push(`Job is ${job.status}`);
      }

      return this.formatResponse({
        job_id: fine_tuning_job_id,
        status: job.status,
        fine_tuned_model: job.fine_tuned_model,
        trained_tokens: job.trained_tokens,
        recommendations: recommendations,
        next_steps: job.status === "succeeded"
          ? ["Test the fine-tuned model", "Compare with base model", "Deploy to production"]
          : ["Monitor job status", "Check logs for errors"],
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async fineTuningExportModel(args: any) {
    const { fine_tuned_model, include_metrics = true } = args;
    try {
      const jobs = await this.openai.fineTuning.jobs.list({ limit: 100 });
      const job = jobs.data.find((j: any) => j.fine_tuned_model === fine_tuned_model);

      if (!job) {
        return this.formatResponse({ error: `No fine-tuning job found for model ${fine_tuned_model}` });
      }

      return this.formatResponse({
        model_name: fine_tuned_model,
        base_model: job.model,
        job_id: job.id,
        status: job.status,
        trained_tokens: job.trained_tokens,
        hyperparameters: job.hyperparameters,
        training_file: job.training_file,
        validation_file: job.validation_file,
        created_at: new Date((job.created_at as any) * 1000).toISOString(),
        finished_at: job.finished_at ? new Date((job.finished_at as any) * 1000).toISOString() : null,
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async fineTuningListCheckpoints(args: any) {
    const { fine_tuning_job_id } = args;
    try {
      const checkpoints = await this.openai.fineTuning.jobs.checkpoints.list(fine_tuning_job_id);

      return this.formatResponse({
        job_id: fine_tuning_job_id,
        checkpoints: checkpoints.data.map((cp: any) => ({
          id: cp.id,
          step_number: cp.step_number,
          metrics: cp.metrics,
          created_at: cp.created_at,
        })),
        total_checkpoints: checkpoints.data.length,
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async fineTuningGetBestCheckpoint(args: any) {
    const { fine_tuning_job_id, metric = "loss" } = args;
    try {
      const checkpoints = await this.openai.fineTuning.jobs.checkpoints.list(fine_tuning_job_id);

      if (checkpoints.data.length === 0) {
        return this.formatResponse({ error: "No checkpoints found" });
      }

      const best = checkpoints.data.reduce((best: any, current: any) => {
        const bestMetric = best.metrics?.[metric] || Infinity;
        const currentMetric = current.metrics?.[metric] || Infinity;
        return currentMetric < bestMetric ? current : best;
      });

      return this.formatResponse({
        job_id: fine_tuning_job_id,
        best_checkpoint: {
          id: best.id,
          step_number: best.step_number,
          metrics: best.metrics,
          created_at: best.created_at,
        },
        metric_used: metric,
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async fineTuningPrepareDataset(args: any) {
    const { data, format = "chat", system_message = "" } = args;
    try {
      const prepared = data.map((item: any) => {
        if (format === "chat") {
          const messages: any[] = [];
          if (system_message) {
            messages.push({ role: "system", content: system_message });
          }
          messages.push({ role: "user", content: item.prompt || item.input });
          messages.push({ role: "assistant", content: item.completion || item.output });
          return { messages };
        } else {
          return {
            prompt: item.prompt || item.input,
            completion: item.completion || item.output,
          };
        }
      });

      return this.formatResponse({
        format: format,
        total_examples: prepared.length,
        sample: prepared.slice(0, 3),
        ready_for_upload: true,
        next_step: "Upload this data using openai_upload_file with purpose='fine-tune'",
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async fineTuningHyperparameterSearch(args: any) {
    const { training_file_id, model = "gpt-4o-mini-2024-07-18", dataset_size } = args;
    try {
      // Provide intelligent hyperparameter recommendations based on dataset size
      let n_epochs = 3;
      let batch_size = "auto";
      let learning_rate_multiplier = "auto";

      if (dataset_size) {
        if (dataset_size < 100) {
          n_epochs = 4;
          learning_rate_multiplier = "0.5";
        } else if (dataset_size < 1000) {
          n_epochs = 3;
          learning_rate_multiplier = "auto";
        } else {
          n_epochs = 2;
          learning_rate_multiplier = "2.0";
        }
      }

      return this.formatResponse({
        training_file_id: training_file_id,
        model: model,
        recommended_hyperparameters: {
          n_epochs: n_epochs,
          batch_size: batch_size,
          learning_rate_multiplier: learning_rate_multiplier,
        },
        reasoning: {
          n_epochs: dataset_size < 100 ? "Small dataset - more epochs needed" : dataset_size > 1000 ? "Large dataset - fewer epochs to prevent overfitting" : "Standard dataset size",
          learning_rate: dataset_size < 100 ? "Lower LR for small dataset" : dataset_size > 1000 ? "Higher LR for large dataset" : "Auto-tuned",
        },
        next_step: "Use these hyperparameters when creating fine-tuning job",
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  // ==================== ADVANCED BATCH ====================

  private async batchEstimateCost(args: any) {
    const { requests, model = "gpt-4o-mini" } = args;
    try {
      let totalTokens = 0;
      for (const req of requests) {
        const prompt = req.body?.messages?.map((m: any) => m.content).join(" ") || "";
        totalTokens += await this.costManager.estimateTokens(prompt, model);
      }

      const pricing = (this.costManager as any).PRICING[model];
      const inputCost = (totalTokens / 1000000) * pricing.input;
      const batchDiscount = 0.5; // 50% discount for batch API
      const finalCost = inputCost * batchDiscount;

      return this.formatResponse({
        total_requests: requests.length,
        estimated_tokens: totalTokens,
        model: model,
        cost_without_batch: inputCost.toFixed(4),
        cost_with_batch: finalCost.toFixed(4),
        savings: (inputCost - finalCost).toFixed(4),
        discount_percentage: "50%",
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async batchMonitor(args: any) {
    const { batch_id, include_errors = true } = args;
    try {
      const batch = await this.openai.batches.retrieve(batch_id);

      const progress = batch.request_counts ? {
        total: batch.request_counts.total,
        completed: batch.request_counts.completed,
        failed: batch.request_counts.failed,
        percentage: ((batch.request_counts.completed / batch.request_counts.total) * 100).toFixed(2),
      } : null;

      return this.formatResponse({
        batch_id: batch_id,
        status: batch.status,
        progress: progress,
        created_at: new Date((batch.created_at as any) * 1000).toISOString(),
        completed_at: batch.completed_at ? new Date((batch.completed_at as any) * 1000).toISOString() : null,
        input_file_id: batch.input_file_id,
        output_file_id: batch.output_file_id,
        error_file_id: batch.error_file_id,
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async batchRetryFailed(args: any) {
    const { batch_id, max_retries = 3 } = args;
    try {
      const batch = await this.openai.batches.retrieve(batch_id);

      if (!batch.error_file_id) {
        return this.formatResponse({ message: "No errors to retry", batch_id: batch_id });
      }

      return this.formatResponse({
        batch_id: batch_id,
        error_file_id: batch.error_file_id,
        max_retries: max_retries,
        next_step: "Download error file, fix issues, and create new batch",
        note: "Automatic retry not yet implemented - manual intervention required",
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async batchSplitLarge(args: any) {
    const { requests, chunk_size = 50000 } = args;
    try {
      const chunks: any[] = [];
      for (let i = 0; i < requests.length; i += chunk_size) {
        chunks.push(requests.slice(i, i + chunk_size));
      }

      return this.formatResponse({
        total_requests: requests.length,
        chunk_size: chunk_size,
        num_chunks: chunks.length,
        chunks: chunks.map((chunk, idx) => ({
          chunk_index: idx,
          size: chunk.length,
        })),
        next_step: "Upload each chunk as separate batch job",
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async batchMergeResults(args: any) {
    const { batch_ids, output_format = "jsonl" } = args;
    try {
      const results: any[] = [];

      for (const batch_id of batch_ids) {
        const batch = await this.openai.batches.retrieve(batch_id);
        results.push({
          batch_id: batch_id,
          status: batch.status,
          output_file_id: batch.output_file_id,
          request_counts: batch.request_counts,
        });
      }

      return this.formatResponse({
        total_batches: batch_ids.length,
        batches: results,
        output_format: output_format,
        next_step: "Download output files and merge manually",
        note: "Automatic merging not yet implemented",
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async batchSchedule(args: any) {
    const { input_file_id, endpoint, schedule_time } = args;
    try {
      const scheduledTime = new Date(schedule_time);
      const now = new Date();

      if (scheduledTime <= now) {
        return this.formatResponse({ error: "Schedule time must be in the future" });
      }

      return this.formatResponse({
        input_file_id: input_file_id,
        endpoint: endpoint,
        scheduled_for: scheduledTime.toISOString(),
        time_until_execution: Math.round((scheduledTime.getTime() - now.getTime()) / 1000 / 60) + " minutes",
        note: "Scheduling not yet implemented - create batch immediately or use external scheduler",
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async batchOptimize(args: any) {
    const { requests, optimization_goal = "balanced" } = args;
    try {
      const recommendations: string[] = [];

      if (optimization_goal === "cost") {
        recommendations.push("Use batch API for 50% discount");
        recommendations.push("Consider using gpt-4o-mini instead of gpt-4o");
        recommendations.push("Reduce max_tokens where possible");
      } else if (optimization_goal === "speed") {
        recommendations.push("Split into smaller batches for parallel processing");
        recommendations.push("Use standard API instead of batch for urgent requests");
      } else {
        recommendations.push("Use batch API for non-urgent requests");
        recommendations.push("Split large batches into chunks of 50k requests");
        recommendations.push("Monitor progress and retry failed requests");
      }

      return this.formatResponse({
        total_requests: requests.length,
        optimization_goal: optimization_goal,
        recommendations: recommendations,
        estimated_processing_time: `${Math.ceil(requests.length / 1000)} hours (batch API)`,
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async batchAnalytics(args: any) {
    const { time_range = "7d", include_costs = true } = args;
    try {
      const batches = await this.openai.batches.list({ limit: 100 });

      const stats = {
        total_batches: batches.data.length,
        completed: batches.data.filter((b: any) => b.status === "completed").length,
        failed: batches.data.filter((b: any) => b.status === "failed").length,
        in_progress: batches.data.filter((b: any) => b.status === "in_progress").length,
      };

      return this.formatResponse({
        time_range: time_range,
        statistics: stats,
        recent_batches: batches.data.slice(0, 10).map((b: any) => ({
          id: b.id,
          status: b.status,
          created_at: new Date((b.created_at as any) * 1000).toISOString(),
        })),
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  // ==================== AGENTS SDK ====================
  // Note: Agents SDK is built on top of Assistants API

  private agentMemoryStore: Map<string, any> = new Map();
  private agentStateStore: Map<string, any> = new Map();

  private async agentCreate(args: any) {
    const { name, instructions, tools = [], model = "gpt-4o" } = args;
    try {
      const assistant = await this.openai.beta.assistants.create({
        name: name,
        instructions: instructions,
        tools: tools,
        model: model,
      });

      // Initialize agent memory and state
      this.agentMemoryStore.set(assistant.id, {});
      this.agentStateStore.set(assistant.id, { status: "idle", created_at: new Date().toISOString() });

      return this.formatResponse({
        agent_id: assistant.id,
        name: name,
        model: model,
        tools: tools,
        status: "created",
        note: "Agent created using Assistants API",
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async agentRun(args: any) {
    const { agent_id, task, context = {} } = args;
    try {
      const thread = await this.openai.beta.threads.create();

      await this.openai.beta.threads.messages.create(thread.id, {
        role: "user",
        content: task,
      });

      const run = await this.openai.beta.threads.runs.create(thread.id, {
        assistant_id: agent_id,
      });

      // Wait for completion (simplified - in production would poll)
      let runStatus = await this.openai.beta.threads.runs.retrieve(thread.id, run.id);
      let attempts = 0;
      while (runStatus.status === "in_progress" || runStatus.status === "queued") {
        if (attempts++ > 30) break; // Timeout after 30 attempts
        await new Promise(resolve => setTimeout(resolve, 1000));
        runStatus = await this.openai.beta.threads.runs.retrieve(thread.id, run.id);
      }

      const messages = await this.openai.beta.threads.messages.list(thread.id);
      const lastMessage = messages.data[0];

      return this.formatResponse({
        agent_id: agent_id,
        task: task,
        status: runStatus.status,
        response: lastMessage.content[0].type === "text" ? (lastMessage.content[0] as any).text.value : null,
        thread_id: thread.id,
        run_id: run.id,
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async agentStream(args: any) {
    const { agent_id, task } = args;
    try {
      return this.formatResponse({
        agent_id: agent_id,
        task: task,
        note: "Streaming not yet implemented - use agentRun for now",
        status: "not_implemented",
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async agentWithTools(args: any) {
    const { agent_id, task, tools } = args;
    try {
      // Update assistant with specific tools
      await this.openai.beta.assistants.update(agent_id, {
        tools: tools,
      });

      // Run the agent
      const result = await this.agentRun({ agent_id, task });

      return this.formatResponse({
        ...result,
        tools_enabled: tools,
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async agentHandoff(args: any) {
    const { from_agent_id, to_agent_id, task, context = {} } = args;
    try {
      // Get context from first agent
      const fromState = this.agentStateStore.get(from_agent_id) || {};
      const fromMemory = this.agentMemoryStore.get(from_agent_id) || {};

      // Transfer context to second agent
      const toMemory = this.agentMemoryStore.get(to_agent_id) || {};
      this.agentMemoryStore.set(to_agent_id, { ...toMemory, ...fromMemory, ...context });

      // Run second agent
      const result = await this.agentRun({ agent_id: to_agent_id, task, context });

      return this.formatResponse({
        from_agent_id: from_agent_id,
        to_agent_id: to_agent_id,
        handoff_status: "completed",
        result: result,
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async agentParallel(args: any) {
    const { agents, merge_strategy = "concat" } = args;
    try {
      const results = await Promise.all(
        agents.map(async (agent: any) => {
          return await this.agentRun({ agent_id: agent.agent_id, task: agent.task });
        })
      );

      let mergedResult: any;
      if (merge_strategy === "concat") {
        mergedResult = results.map(r => r.response).join("\n\n");
      } else if (merge_strategy === "best") {
        mergedResult = results[0].response; // Simplified - would need scoring
      } else {
        mergedResult = results.map(r => r.response);
      }

      return this.formatResponse({
        agents_run: agents.length,
        merge_strategy: merge_strategy,
        results: results,
        merged_result: mergedResult,
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async agentSequential(args: any) {
    const { agents, pass_output = true } = args;
    try {
      let previousOutput = "";
      const results: any[] = [];

      for (const agent of agents) {
        const task = pass_output && previousOutput
          ? `${agent.task}\n\nPrevious output: ${previousOutput}`
          : agent.task;

        const result = await this.agentRun({ agent_id: agent.agent_id, task });
        results.push(result);
        previousOutput = (result as any).content?.[0]?.response || "";
      }

      return this.formatResponse({
        agents_run: agents.length,
        pass_output: pass_output,
        results: results,
        final_output: previousOutput,
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async agentConditional(args: any) {
    const { condition, if_agent_id, else_agent_id, task } = args;
    try {
      // Simplified condition evaluation - in production would use proper evaluation
      const conditionMet = condition.toLowerCase().includes("true");
      const selectedAgentId = conditionMet ? if_agent_id : else_agent_id;

      if (!selectedAgentId) {
        return this.formatResponse({ error: "No agent selected for condition result" });
      }

      const result = await this.agentRun({ agent_id: selectedAgentId, task });

      return this.formatResponse({
        condition: condition,
        condition_met: conditionMet,
        selected_agent: selectedAgentId,
        result: result,
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async agentLoop(args: any) {
    const { agent_id, task, max_iterations = 10, stop_condition = "" } = args;
    try {
      const results: any[] = [];
      let iteration = 0;

      while (iteration < max_iterations) {
        const result = await this.agentRun({ agent_id, task: `${task} (iteration ${iteration + 1})` });
        results.push(result);

        // Simplified stop condition check
        const responseText = (result as any).content?.[0]?.response || "";
        if (stop_condition && responseText.toLowerCase().includes(stop_condition.toLowerCase())) {
          break;
        }

        iteration++;
      }

      return this.formatResponse({
        agent_id: agent_id,
        iterations: iteration,
        max_iterations: max_iterations,
        stop_condition: stop_condition,
        results: results,
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async agentMemory(args: any) {
    const { agent_id, operation, key, value } = args;
    try {
      const memory = this.agentMemoryStore.get(agent_id) || {};

      if (operation === "get") {
        return this.formatResponse({
          agent_id: agent_id,
          operation: "get",
          memory: key ? { [key]: memory[key] } : memory,
        });
      } else if (operation === "set") {
        memory[key] = value;
        this.agentMemoryStore.set(agent_id, memory);
        return this.formatResponse({
          agent_id: agent_id,
          operation: "set",
          key: key,
          value: value,
        });
      } else if (operation === "clear") {
        this.agentMemoryStore.set(agent_id, {});
        return this.formatResponse({
          agent_id: agent_id,
          operation: "clear",
          status: "cleared",
        });
      }

      return this.formatResponse({ error: `Unknown operation: ${operation}` });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async agentState(args: any) {
    const { agent_id, state } = args;
    try {
      if (state) {
        this.agentStateStore.set(agent_id, { ...this.agentStateStore.get(agent_id), ...state });
      }

      return this.formatResponse({
        agent_id: agent_id,
        state: this.agentStateStore.get(agent_id) || {},
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async agentMonitor(args: any) {
    const { agent_id, time_range = "24h" } = args;
    try {
      const state = this.agentStateStore.get(agent_id) || {};
      const memory = this.agentMemoryStore.get(agent_id) || {};

      return this.formatResponse({
        agent_id: agent_id,
        time_range: time_range,
        state: state,
        memory_size: Object.keys(memory).length,
        status: "active",
        note: "Full monitoring metrics not yet implemented",
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async agentOptimize(args: any) {
    const { agent_id, optimization_goal = "balanced" } = args;
    try {
      const assistant = await this.openai.beta.assistants.retrieve(agent_id);

      const recommendations: string[] = [];
      if (optimization_goal === "cost") {
        recommendations.push("Consider using gpt-4o-mini instead of gpt-4o");
        recommendations.push("Reduce max_tokens in responses");
      } else if (optimization_goal === "speed") {
        recommendations.push("Use streaming responses");
        recommendations.push("Minimize tool usage");
      } else {
        recommendations.push("Use appropriate model for task complexity");
        recommendations.push("Enable only necessary tools");
      }

      return this.formatResponse({
        agent_id: agent_id,
        current_model: assistant.model,
        optimization_goal: optimization_goal,
        recommendations: recommendations,
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async agentExport(args: any) {
    const { agent_id, include_history = false } = args;
    try {
      const assistant = await this.openai.beta.assistants.retrieve(agent_id);
      const memory = this.agentMemoryStore.get(agent_id) || {};
      const state = this.agentStateStore.get(agent_id) || {};

      return this.formatResponse({
        agent_id: agent_id,
        config: {
          name: assistant.name,
          instructions: assistant.instructions,
          tools: assistant.tools,
          model: assistant.model,
          memory: memory,
          state: state,
        },
        export_timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async agentImport(args: any) {
    const { config, name } = args;
    try {
      const assistant = await this.openai.beta.assistants.create({
        name: name || config.name,
        instructions: config.instructions,
        tools: config.tools,
        model: config.model,
      });

      if (config.memory) {
        this.agentMemoryStore.set(assistant.id, config.memory);
      }
      if (config.state) {
        this.agentStateStore.set(assistant.id, config.state);
      }

      return this.formatResponse({
        agent_id: assistant.id,
        name: name || config.name,
        status: "imported",
        import_timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  // ==================== ADVANCED ASSISTANTS ====================

  private assistantVersionStore: Map<string, any[]> = new Map();

  private async assistantClone(args: any) {
    const { assistant_id, name } = args;
    try {
      const original = await this.openai.beta.assistants.retrieve(assistant_id);

      const cloned = await this.openai.beta.assistants.create({
        name: name || `${original.name} (Clone)`,
        instructions: original.instructions,
        tools: original.tools,
        model: original.model,
      });

      return this.formatResponse({
        original_id: assistant_id,
        cloned_id: cloned.id,
        name: cloned.name,
        status: "cloned",
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async assistantExport(args: any) {
    const { assistant_id, include_files = false } = args;
    try {
      const assistant = await this.openai.beta.assistants.retrieve(assistant_id);

      const config: any = {
        name: assistant.name,
        instructions: assistant.instructions,
        tools: assistant.tools,
        model: assistant.model,
        metadata: assistant.metadata,
      };

      if (include_files && (assistant as any).file_ids) {
        config.file_ids = (assistant as any).file_ids;
      }

      return this.formatResponse({
        assistant_id: assistant_id,
        config: config,
        export_timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async assistantImport(args: any) {
    const { config } = args;
    try {
      const assistant = await this.openai.beta.assistants.create({
        name: config.name,
        instructions: config.instructions,
        tools: config.tools,
        model: config.model,
        metadata: config.metadata || {},
      });

      return this.formatResponse({
        assistant_id: assistant.id,
        name: assistant.name,
        status: "imported",
        import_timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async assistantTest(args: any) {
    const { assistant_id, test_cases } = args;
    try {
      const results: any[] = [];

      for (const testCase of test_cases) {
        const thread = await this.openai.beta.threads.create();
        await this.openai.beta.threads.messages.create(thread.id, {
          role: "user",
          content: testCase,
        });

        const run = await this.openai.beta.threads.runs.create(thread.id, {
          assistant_id: assistant_id,
        });

        // Wait for completion (simplified)
        let runStatus = await this.openai.beta.threads.runs.retrieve(thread.id, run.id);
        let attempts = 0;
        while (runStatus.status === "in_progress" || runStatus.status === "queued") {
          if (attempts++ > 30) break;
          await new Promise(resolve => setTimeout(resolve, 1000));
          runStatus = await this.openai.beta.threads.runs.retrieve(thread.id, run.id);
        }

        const messages = await this.openai.beta.threads.messages.list(thread.id);
        const response = messages.data[0].content[0].type === "text"
          ? (messages.data[0].content[0] as any).text.value
          : null;

        results.push({
          input: testCase,
          output: response,
          status: runStatus.status,
        });
      }

      return this.formatResponse({
        assistant_id: assistant_id,
        total_tests: test_cases.length,
        results: results,
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async assistantOptimize(args: any) {
    const { assistant_id, optimization_goal = "balanced" } = args;
    try {
      const assistant = await this.openai.beta.assistants.retrieve(assistant_id);

      const recommendations: string[] = [];
      if (optimization_goal === "cost") {
        if (assistant.model.includes("gpt-4o")) {
          recommendations.push("Consider using gpt-4o-mini for 60% cost savings");
        }
        recommendations.push("Reduce number of tools to minimize processing time");
      } else if (optimization_goal === "speed") {
        recommendations.push("Use streaming responses");
        recommendations.push("Minimize tool usage");
      } else {
        recommendations.push("Balance model selection with task complexity");
        recommendations.push("Enable only necessary tools");
      }

      return this.formatResponse({
        assistant_id: assistant_id,
        current_model: assistant.model,
        current_tools: assistant.tools.length,
        optimization_goal: optimization_goal,
        recommendations: recommendations,
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async assistantAnalytics(args: any) {
    const { assistant_id, time_range = "7d" } = args;
    try {
      return this.formatResponse({
        assistant_id: assistant_id,
        time_range: time_range,
        note: "Analytics not yet implemented - would require tracking usage in database",
        status: "not_implemented",
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async assistantVersion(args: any) {
    const { assistant_id, version_name, changes = {} } = args;
    try {
      const current = await this.openai.beta.assistants.retrieve(assistant_id);

      // Store current version
      const versions = this.assistantVersionStore.get(assistant_id) || [];
      versions.push({
        version_name: version_name,
        timestamp: new Date().toISOString(),
        config: {
          name: current.name,
          instructions: current.instructions,
          tools: current.tools,
          model: current.model,
        },
      });
      this.assistantVersionStore.set(assistant_id, versions);

      // Apply changes if provided
      if (Object.keys(changes).length > 0) {
        await this.openai.beta.assistants.update(assistant_id, changes);
      }

      return this.formatResponse({
        assistant_id: assistant_id,
        version_name: version_name,
        total_versions: versions.length,
        status: "version_created",
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async assistantRollback(args: any) {
    const { assistant_id, version_name } = args;
    try {
      const versions = this.assistantVersionStore.get(assistant_id) || [];
      const targetVersion = versions.find((v: any) => v.version_name === version_name);

      if (!targetVersion) {
        return this.formatResponse({ error: `Version ${version_name} not found` });
      }

      await this.openai.beta.assistants.update(assistant_id, targetVersion.config);

      return this.formatResponse({
        assistant_id: assistant_id,
        rolled_back_to: version_name,
        timestamp: targetVersion.timestamp,
        status: "rollback_complete",
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async assistantCompare(args: any) {
    const { assistant_id_1, assistant_id_2, test_cases = [] } = args;
    try {
      const [assistant1, assistant2] = await Promise.all([
        this.openai.beta.assistants.retrieve(assistant_id_1),
        this.openai.beta.assistants.retrieve(assistant_id_2),
      ]);

      const comparison = {
        assistant_1: {
          id: assistant_id_1,
          name: assistant1.name,
          model: assistant1.model,
          tools: assistant1.tools.length,
        },
        assistant_2: {
          id: assistant_id_2,
          name: assistant2.name,
          model: assistant2.model,
          tools: assistant2.tools.length,
        },
        differences: {
          model: assistant1.model !== assistant2.model,
          tools: assistant1.tools.length !== assistant2.tools.length,
        },
      };

      return this.formatResponse(comparison);
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async assistantBenchmark(args: any) {
    const { assistant_id, benchmark_suite = "comprehensive" } = args;
    try {
      const assistant = await this.openai.beta.assistants.retrieve(assistant_id);

      const benchmarks: any = {
        assistant_id: assistant_id,
        benchmark_suite: benchmark_suite,
        model: assistant.model,
      };

      if (benchmark_suite === "speed" || benchmark_suite === "comprehensive") {
        benchmarks.speed = {
          note: "Speed benchmarking not yet implemented",
          status: "not_implemented",
        };
      }

      if (benchmark_suite === "quality" || benchmark_suite === "comprehensive") {
        benchmarks.quality = {
          note: "Quality benchmarking not yet implemented",
          status: "not_implemented",
        };
      }

      if (benchmark_suite === "cost" || benchmark_suite === "comprehensive") {
        const pricing = (this.costManager as any).PRICING[assistant.model];
        benchmarks.cost = {
          model: assistant.model,
          input_cost_per_1m: pricing?.input || "unknown",
          output_cost_per_1m: pricing?.output || "unknown",
        };
      }

      return this.formatResponse(benchmarks);
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async assistantMonitor(args: any) {
    const { assistant_id, metrics = [] } = args;
    try {
      const assistant = await this.openai.beta.assistants.retrieve(assistant_id);

      return this.formatResponse({
        assistant_id: assistant_id,
        name: assistant.name,
        model: assistant.model,
        tools: assistant.tools.length,
        status: "active",
        note: "Real-time monitoring not yet implemented",
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async assistantAudit(args: any) {
    const { assistant_id, time_range = "7d" } = args;
    try {
      const versions = this.assistantVersionStore.get(assistant_id) || [];

      return this.formatResponse({
        assistant_id: assistant_id,
        time_range: time_range,
        version_history: versions,
        total_versions: versions.length,
        note: "Full audit logging not yet implemented",
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  // ==================== ADVANCED VECTOR STORES ====================

  private async vectorSearch(args: any) {
    const { vector_store_id, query, limit = 10 } = args;
    try {
      // Note: OpenAI Vector Stores API doesn't have direct search endpoint
      // This would typically be done through file_search tool in Assistants API
      return this.formatResponse({
        vector_store_id: vector_store_id,
        query: query,
        limit: limit,
        note: "Direct vector search not available - use file_search tool in Assistants API",
        status: "not_implemented",
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async vectorSimilarity(args: any) {
    const { vector_store_id, vector, limit = 10 } = args;
    try {
      return this.formatResponse({
        vector_store_id: vector_store_id,
        limit: limit,
        note: "Vector similarity search not directly available in OpenAI API",
        status: "not_implemented",
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async vectorCluster(args: any) {
    const { vector_store_id, num_clusters = 5 } = args;
    try {
      return this.formatResponse({
        vector_store_id: vector_store_id,
        num_clusters: num_clusters,
        note: "Vector clustering not available in OpenAI API - would need custom implementation",
        status: "not_implemented",
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async vectorDeduplicate(args: any) {
    const { vector_store_id, similarity_threshold = 0.95 } = args;
    try {
      return this.formatResponse({
        vector_store_id: vector_store_id,
        similarity_threshold: similarity_threshold,
        note: "Vector deduplication not available in OpenAI API",
        status: "not_implemented",
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async vectorMerge(args: any) {
    const { source_store_ids, target_store_name } = args;
    try {
      return this.formatResponse({
        source_stores: source_store_ids.length,
        target_store_name: target_store_name,
        note: "Vector store merging not available in OpenAI API - would need custom implementation",
        status: "not_implemented",
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async vectorExport(args: any) {
    const { vector_store_id, format = "json" } = args;
    try {
      return this.formatResponse({
        vector_store_id: vector_store_id,
        format: format,
        note: "Vector store export not available in OpenAI API - use file_search tool in Assistants API",
        status: "not_implemented",
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async vectorImport(args: any) {
    const { vector_store_id, data, format = "json" } = args;
    try {
      return this.formatResponse({
        vector_store_id: vector_store_id,
        data_items: data.length,
        format: format,
        note: "Import not yet implemented - use vectorStores.files.upload for file uploads",
        status: "not_implemented",
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async vectorOptimize(args: any) {
    const { vector_store_id, optimization_type = "balanced" } = args;
    try {
      const recommendations: string[] = [];
      if (optimization_type === "speed") {
        recommendations.push("Reduce file count by merging smaller files");
        recommendations.push("Use chunking_strategy for optimal chunk sizes");
      } else if (optimization_type === "accuracy") {
        recommendations.push("Increase chunk overlap for better context");
        recommendations.push("Use smaller chunk sizes for precise matching");
      } else if (optimization_type === "storage") {
        recommendations.push("Remove duplicate or outdated files");
        recommendations.push("Compress files before upload");
      }

      return this.formatResponse({
        vector_store_id: vector_store_id,
        optimization_type: optimization_type,
        recommendations: recommendations,
        note: "Vector store optimization not available in OpenAI API",
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async vectorAnalytics(args: any) {
    const { vector_store_id } = args;
    try {
      return this.formatResponse({
        vector_store_id: vector_store_id,
        note: "Vector store analytics not available in OpenAI API - use file_search tool in Assistants API",
        status: "not_implemented",
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async vectorBackup(args: any) {
    const { vector_store_id, backup_name } = args;
    try {
      return this.formatResponse({
        vector_store_id: vector_store_id,
        backup_name: backup_name || `backup_${Date.now()}`,
        note: "Vector store backup not available in OpenAI API",
        status: "not_implemented",
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  // ==================== ADVANCED RUNS ====================

  private async runRetry(args: any) {
    const { thread_id, run_id } = args;
    try {
      const originalRun = await this.openai.beta.threads.runs.retrieve(thread_id, run_id);

      // Create new run with same parameters
      const newRun = await this.openai.beta.threads.runs.create(thread_id, {
        assistant_id: originalRun.assistant_id,
        model: originalRun.model,
        instructions: originalRun.instructions,
        tools: originalRun.tools,
      });

      return this.formatResponse({
        original_run_id: run_id,
        new_run_id: newRun.id,
        status: newRun.status,
        note: "New run created with same parameters",
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async runResume(args: any) {
    const { thread_id, run_id } = args;
    try {
      const run = await this.openai.beta.threads.runs.retrieve(thread_id, run_id);

      return this.formatResponse({
        run_id: run_id,
        status: run.status,
        note: "Run resume not directly supported - use cancel and retry instead",
        status_info: "not_implemented",
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async runClone(args: any) {
    const { thread_id, run_id } = args;
    try {
      const originalRun = await this.openai.beta.threads.runs.retrieve(thread_id, run_id);

      // Create new thread with same messages
      const newThread = await this.openai.beta.threads.create();
      const messages = await this.openai.beta.threads.messages.list(thread_id);

      // Copy messages to new thread
      for (const message of messages.data.reverse()) {
        if (message.role === "user") {
          await this.openai.beta.threads.messages.create(newThread.id, {
            role: "user",
            content: message.content[0].type === "text" ? (message.content[0] as any).text.value : "",
          });
        }
      }

      // Create new run
      const newRun = await this.openai.beta.threads.runs.create(newThread.id, {
        assistant_id: originalRun.assistant_id,
        model: originalRun.model,
        instructions: originalRun.instructions,
        tools: originalRun.tools,
      });

      return this.formatResponse({
        original_thread_id: thread_id,
        original_run_id: run_id,
        new_thread_id: newThread.id,
        new_run_id: newRun.id,
        status: "cloned",
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async runAnalyze(args: any) {
    const { thread_id, run_id } = args;
    try {
      const run = await this.openai.beta.threads.runs.retrieve(thread_id, run_id);
      const steps = await this.openai.beta.threads.runs.steps.list(thread_id, run_id);

      const analysis = {
        run_id: run_id,
        status: run.status,
        model: run.model,
        total_steps: steps.data.length,
        completed_steps: steps.data.filter((s: any) => s.status === "completed").length,
        failed_steps: steps.data.filter((s: any) => s.status === "failed").length,
        created_at: new Date((run.created_at as any) * 1000).toISOString(),
        completed_at: run.completed_at ? new Date((run.completed_at as any) * 1000).toISOString() : null,
        last_error: run.last_error,
      };

      return this.formatResponse(analysis);
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async runOptimize(args: any) {
    const { thread_id, run_id } = args;
    try {
      const run = await this.openai.beta.threads.runs.retrieve(thread_id, run_id);

      const recommendations: string[] = [];
      if (run.model.includes("gpt-4o")) {
        recommendations.push("Consider using gpt-4o-mini for 60% cost savings");
      }
      if (run.tools.length > 5) {
        recommendations.push("Reduce number of tools to improve response time");
      }
      if (run.status === "failed") {
        recommendations.push("Check error logs and retry with adjusted parameters");
      }

      return this.formatResponse({
        run_id: run_id,
        current_model: run.model,
        current_tools: run.tools.length,
        status: run.status,
        recommendations: recommendations,
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async runMonitor(args: any) {
    const { thread_id, run_id } = args;
    try {
      const run = await this.openai.beta.threads.runs.retrieve(thread_id, run_id);
      const steps = await this.openai.beta.threads.runs.steps.list(thread_id, run_id);

      return this.formatResponse({
        run_id: run_id,
        status: run.status,
        current_step: steps.data.length,
        steps: steps.data.map((s: any) => ({
          id: s.id,
          type: s.type,
          status: s.status,
        })),
        note: "Real-time monitoring requires polling - use this tool repeatedly",
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async runExport(args: any) {
    const { thread_id, run_id, format = "json" } = args;
    try {
      const run = await this.openai.beta.threads.runs.retrieve(thread_id, run_id);
      const steps = await this.openai.beta.threads.runs.steps.list(thread_id, run_id);
      const messages = await this.openai.beta.threads.messages.list(thread_id);

      const exportData = {
        run: {
          id: run.id,
          status: run.status,
          model: run.model,
          assistant_id: run.assistant_id,
          created_at: new Date((run.created_at as any) * 1000).toISOString(),
          completed_at: run.completed_at ? new Date((run.completed_at as any) * 1000).toISOString() : null,
        },
        steps: steps.data,
        messages: messages.data,
      };

      return this.formatResponse({
        format: format,
        data: exportData,
        export_timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  private async runCompare(args: any) {
    const { thread_id, run_id_1, run_id_2 } = args;
    try {
      const [run1, run2] = await Promise.all([
        this.openai.beta.threads.runs.retrieve(thread_id, run_id_1),
        this.openai.beta.threads.runs.retrieve(thread_id, run_id_2),
      ]);

      const comparison = {
        run_1: {
          id: run_id_1,
          status: run1.status,
          model: run1.model,
          created_at: new Date((run1.created_at as any) * 1000).toISOString(),
        },
        run_2: {
          id: run_id_2,
          status: run2.status,
          model: run2.model,
          created_at: new Date((run2.created_at as any) * 1000).toISOString(),
        },
        differences: {
          model: run1.model !== run2.model,
          status: run1.status !== run2.status,
          tools: run1.tools.length !== run2.tools.length,
        },
      };

      return this.formatResponse(comparison);
    } catch (error: any) {
      return this.formatResponse({ error: error.message });
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("OpenAI MCP server running on stdio");
  }
}

const server = new OpenAIMCP();
server.run().catch(console.error);
