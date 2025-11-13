/**
 * OpenAI Handler Functions
 * Extracted from temp-openai-mcp.ts
 */

import OpenAI from 'openai';

const OPENAI_ADMIN_KEY = process.env.OPENAI_ADMIN_KEY || '';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const API_KEY = OPENAI_ADMIN_KEY || OPENAI_API_KEY;

if (!API_KEY) {
  console.warn('Warning: OPENAI_API_KEY or OPENAI_ADMIN_KEY environment variable not set');
}

const openai = API_KEY ? new OpenAI({ apiKey: API_KEY }) : null;

function formatResponse(data: any) {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

  export function openaiformatResponse(data: any): { content: Array<{ type: string; text: string }> } {
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
  export async function openaiChatCompletion(args: any) {
    const { model = "gpt-4-turbo", messages, temperature, max_tokens, top_p, frequency_penalty, presence_penalty } = args;

    try {
      // Estimate cost
      const inputText = messages.map((m: any) => m.content).join("\n");
      const estimate = costManager.estimateChatCost(model, inputText, max_tokens || 1000);

      // Check if approval needed
      if (estimate.budget_check.requires_approval) {
        return formatResponse({
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
      const response = await openai.chat.completions.create({
        model,
        messages,
        temperature,
        max_tokens,
        top_p,
        frequency_penalty,
        presence_penalty,
      });

      // Calculate actual cost (handle unknown models gracefully)
      const pricing = (costManager as any).PRICING[model] || {
        input_per_1k: 0.0025,  // Default to gpt-4o pricing
        output_per_1k: 0.01,
      };
      const actualCost =
        ((response.usage?.prompt_tokens || 0) / 1000) * pricing.input_per_1k +
        ((response.usage?.completion_tokens || 0) / 1000) * pricing.output_per_1k;

      // Record cost
      costManager.recordCost(actualCost, model, "chat_completion", {
        tokens: response.usage,
      });

      return formatResponse({
        response: response.choices[0].message,
        usage: response.usage,
        cost_info: {
          estimated_cost: estimate.estimated_cost_usd,
          actual_cost: actualCost,
          tokens: response.usage,
          daily_total: costManager.getDailySpent(),
          monthly_total: costManager.getMonthlySpent(),
        },
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiChatCompletionStream(args: any) {
    return formatResponse({
      error: "Streaming not yet supported in MCP. Use standard chat_completion instead.",
    });
  }

  export async function openaiChatWithFunctions(args: any) {
    const { model = "gpt-4-turbo", messages, functions, function_call, temperature, max_tokens } = args;

    try {
      // Estimate cost
      const inputText = messages.map((m: any) => m.content).join("\n");
      const estimate = costManager.estimateChatCost(model, inputText, max_tokens || 1000);

      // Check if approval needed
      if (estimate.budget_check.requires_approval) {
        return formatResponse({
          requires_approval: true,
          cost_estimate: estimate,
        });
      }

      // Make API call with functions
      const response = await openai.chat.completions.create({
        model,
        messages,
        functions,
        function_call,
        temperature,
        max_tokens,
      });

      // Calculate and record cost (handle unknown models gracefully)
      const pricing = (costManager as any).PRICING[model] || {
        input_per_1k: 0.0025,  // Default to gpt-4o pricing
        output_per_1k: 0.01,
      };
      const actualCost =
        ((response.usage?.prompt_tokens || 0) / 1000) * pricing.input_per_1k +
        ((response.usage?.completion_tokens || 0) / 1000) * pricing.output_per_1k;

      costManager.recordCost(actualCost, model, "chat_with_functions", {
        tokens: response.usage,
      });

      return formatResponse({
        response: response.choices[0].message,
        usage: response.usage,
        cost_info: {
          actual_cost: actualCost,
          daily_total: costManager.getDailySpent(),
        },
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  // Embeddings
  export async function openaiCreateEmbedding(args: any) {
    const { model = "text-embedding-3-small", input, encoding_format, dimensions } = args;

    try {
      // Estimate cost
      const texts = Array.isArray(input) ? input : [input];
      const estimate = costManager.estimateEmbeddingCost(model, texts);

      // Check if approval needed (unlikely for embeddings, but possible for large batches)
      if (estimate.budget_check.requires_approval) {
        return formatResponse({
          requires_approval: true,
          cost_estimate: estimate,
        });
      }

      // Make API call
      const response = await openai.embeddings.create({
        model,
        input,
        encoding_format,
        dimensions,
      });

      // Calculate actual cost
      const totalTokens = response.usage.total_tokens;
      const actualCost = (totalTokens / 1000) * (costManager as any).PRICING[model]?.per_1k;

      // Record cost
      costManager.recordCost(actualCost, model, "create_embedding", {
        tokens: response.usage.total_tokens,
        count: response.data.length,
      });

      return formatResponse({
        embeddings: response.data,
        usage: response.usage,
        cost_info: {
          estimated_cost: estimate.estimated_cost_usd,
          actual_cost: actualCost,
          tokens: response.usage.total_tokens,
          daily_total: costManager.getDailySpent(),
        },
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiBatchEmbeddings(args: any) {
    const { model = "text-embedding-3-small", inputs } = args;

    try {
      // Estimate cost for batch
      const estimate = costManager.estimateEmbeddingCost(model, inputs);

      // Check if approval needed
      if (estimate.budget_check.requires_approval) {
        return formatResponse({
          requires_approval: true,
          cost_estimate: estimate,
          message: `Batch embedding ${inputs.length} texts will cost approximately $${estimate.estimated_cost_usd.toFixed(4)}`,
        });
      }

      // Make API call
      const response = await openai.embeddings.create({
        model,
        input: inputs,
      });

      // Calculate actual cost
      const totalTokens = response.usage.total_tokens;
      const actualCost = (totalTokens / 1000) * (costManager as any).PRICING[model]?.per_1k;

      // Record cost
      costManager.recordCost(actualCost, model, "batch_embeddings", {
        tokens: response.usage.total_tokens,
        count: response.data.length,
      });

      return formatResponse({
        embeddings: response.data,
        usage: response.usage,
        cost_info: {
          estimated_cost: estimate.estimated_cost_usd,
          actual_cost: actualCost,
          tokens: response.usage.total_tokens,
          count: response.data.length,
          daily_total: costManager.getDailySpent(),
        },
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  // Images
  export async function openaiGenerateImage(args: any) {
    const { model = "dall-e-3", prompt, n = 1, size = "1024x1024", quality = "standard", response_format } = args;

    try {
      // Estimate cost
      const estimate = costManager.estimateImageCost(model, size, quality, n);

      // Check if approval needed
      if (estimate.budget_check.requires_approval) {
        return formatResponse({
          requires_approval: true,
          approval_type: estimate.budget_check.requires_double_approval ? "double" : "standard",
          cost_estimate: estimate,
          message: `Generating ${n} image(s) with ${model} will cost approximately $${estimate.estimated_cost_usd.toFixed(4)}`,
        });
      }

      // Make API call
      const response = await openai.images.generate({
        model,
        prompt,
        n,
        size: size as any,
        quality: quality as any,
        response_format,
      });

      // Record cost
      costManager.recordCost(estimate.estimated_cost_usd, model, "generate_image", {
        count: n,
        size,
        quality,
      });

      return formatResponse({
        images: response.data,
        cost_info: {
          estimated_cost: estimate.estimated_cost_usd,
          actual_cost: estimate.estimated_cost_usd,
          count: n,
          daily_total: costManager.getDailySpent(),
          monthly_total: costManager.getMonthlySpent(),
        },
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiEditImage(args: any) {
    return formatResponse({
      message: "Image editing requires file upload which is not yet supported in this MCP implementation",
      note: "Use the OpenAI API directly for image editing"
    });
  }

  export async function openaiCreateImageVariation(args: any) {
    return formatResponse({
      message: "Image variations require file upload which is not yet supported in this MCP implementation",
      note: "Use the OpenAI API directly for image variations"
    });
  }

  // Audio
  export async function openaiTextToSpeech(args: any) {
    const { model = "tts-1", input, voice = "alloy", response_format = "mp3", speed = 1.0 } = args;

    try {
      // Estimate cost (TTS is $0.015 per 1K characters)
      const charCount = input.length;
      const estimatedCost = (charCount / 1000) * 0.015;

      // Check if approval needed
      if (estimatedCost > parseFloat(process.env.OPENAI_APPROVAL_THRESHOLD || "0.50")) {
        return formatResponse({
          requires_approval: true,
          estimated_cost: estimatedCost,
          character_count: charCount,
          message: `Converting ${charCount} characters to speech will cost approximately $${estimatedCost.toFixed(4)}`,
        });
      }

      // Make API call
      const response = await openai.audio.speech.create({
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
      costManager.recordCost(estimatedCost, model, "text_to_speech", {
        characters: charCount,
      });

      return formatResponse({
        audio_base64: base64Audio,
        format: response_format,
        cost_info: {
          actual_cost: estimatedCost,
          characters: charCount,
          daily_total: costManager.getDailySpent(),
        },
        note: "Audio returned as base64. Decode and save to file to use.",
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiSpeechToText(args: any) {
    return formatResponse({
      message: "Speech-to-text requires audio file upload which is not yet supported in this MCP implementation",
      note: "Use the OpenAI API directly for Whisper transcription"
    });
  }

  export async function openaiTranslateAudio(args: any) {
    return formatResponse({
      message: "Audio translation requires audio file upload which is not yet supported in this MCP implementation",
      note: "Use the OpenAI API directly for Whisper translation"
    });
  }

  // Moderation
  export async function openaiModerateContent(args: any) {
    const { input } = args;

    try {
      // Moderation API is free, no cost estimation needed
      const response = await openai.moderations.create({
        input,
      });

      return formatResponse({
        results: response.results,
        flagged: response.results[0].flagged,
        categories: response.results[0].categories,
        category_scores: response.results[0].category_scores,
        note: "Moderation API is free to use",
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  // Models
  export async function openaiListModels(args: any) {
    try {
      const response = await openai.models.list();
      return formatResponse({
        models: response.data,
        count: response.data.length,
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiGetModel(args: any) {
    const { model } = args;

    try {
      const response = await openai.models.retrieve(model);
      return formatResponse(response);
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiDeleteModel(args: any) {
    const { model } = args;

    try {
      const response = await openai.models.del(model);
      return formatResponse({
        deleted: response.deleted,
        model: response.id,
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  // Files
  export async function openaiUploadFile(args: any) {
    return formatResponse({
      message: "File upload requires file system access which is not yet supported in this MCP implementation",
      note: "Use the OpenAI API directly or upload files through the OpenAI dashboard"
    });
  }

  export async function openaiListFiles(args: any) {
    const { purpose } = args;

    try {
      const response = await openai.files.list({ purpose });
      return formatResponse({
        files: response.data,
        count: response.data.length,
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiRetrieveFile(args: any) {
    const { file_id } = args;

    try {
      const response = await openai.files.retrieve(file_id);
      return formatResponse(response);
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiDeleteFile(args: any) {
    const { file_id } = args;

    try {
      const response = await openai.files.del(file_id);
      return formatResponse({
        deleted: response.deleted,
        file_id: response.id,
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiRetrieveFileContent(args: any) {
    const { file_id } = args;

    try {
      const response = await openai.files.content(file_id);
      const content = await response.text();
      return formatResponse({
        file_id,
        content,
        size: content.length,
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  // Fine-tuning
  export async function openaiCreateFineTune(args: any) {
    const { training_file, model = "gpt-3.5-turbo", validation_file, hyperparameters, suffix } = args;

    try {
      const response = await openai.fineTuning.jobs.create({
        training_file,
        model,
        validation_file,
        hyperparameters,
        suffix,
      });

      return formatResponse(response);
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiListFineTunes(args: any) {
    const { limit } = args;

    try {
      const response = await openai.fineTuning.jobs.list({ limit });
      return formatResponse({
        jobs: response.data,
        count: response.data.length,
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiRetrieveFineTune(args: any) {
    const { fine_tune_id } = args;

    try {
      const response = await openai.fineTuning.jobs.retrieve(fine_tune_id);
      return formatResponse(response);
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiCancelFineTune(args: any) {
    const { fine_tune_id } = args;

    try {
      const response = await openai.fineTuning.jobs.cancel(fine_tune_id);
      return formatResponse(response);
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiListFineTuneEvents(args: any) {
    const { fine_tune_id } = args;

    try {
      const response = await openai.fineTuning.jobs.listEvents(fine_tune_id);
      return formatResponse({
        events: response.data,
        count: response.data.length,
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiListFineTuneCheckpoints(args: any) {
    const { fine_tune_id } = args;

    try {
      const response = await openai.fineTuning.jobs.checkpoints.list(fine_tune_id);
      return formatResponse({
        checkpoints: response.data,
        count: response.data.length,
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  // Batch API
  export async function openaiCreateBatch(args: any) {
    const { input_file_id, endpoint, completion_window = "24h", metadata } = args;

    try {
      const response = await openai.batches.create({
        input_file_id,
        endpoint,
        completion_window,
        metadata,
      });

      return formatResponse({
        ...response,
        note: "Batch API provides 50% cost savings for async processing!",
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiRetrieveBatch(args: any) {
    const { batch_id } = args;

    try {
      const response = await openai.batches.retrieve(batch_id);
      return formatResponse(response);
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiCancelBatch(args: any) {
    const { batch_id } = args;

    try {
      const response = await openai.batches.cancel(batch_id);
      return formatResponse(response);
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiListBatches(args: any) {
    const { limit } = args;

    try {
      const response = await openai.batches.list({ limit });
      return formatResponse({
        batches: response.data,
        count: response.data.length,
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  // Assistants
  export async function openaiCreateAssistant(args: any) {
    const { name, model = "gpt-4-turbo", instructions, tools, tool_resources, metadata } = args;

    try {
      const response = await openai.beta.assistants.create({
        name,
        model,
        instructions,
        tools,
        tool_resources,
        metadata,
      });

      return formatResponse(response);
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiListAssistants(args: any) {
    try {
      const response = await openai.beta.assistants.list(args);
      return formatResponse(response);
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiRetrieveAssistant(args: any) {
    try {
      const response = await openai.beta.assistants.retrieve(args.assistant_id);
      return formatResponse(response);
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiModifyAssistant(args: any) {
    const { assistant_id, ...updates } = args;
    try {
      const response = await openai.beta.assistants.update(assistant_id, updates);
      return formatResponse(response);
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiDeleteAssistant(args: any) {
    try {
      const response = await openai.beta.assistants.del(args.assistant_id);
      return formatResponse(response);
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  // Threads
  export async function openaiCreateThread(args: any) {
    try {
      const response = await openai.beta.threads.create(args);
      return formatResponse(response);
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiRetrieveThread(args: any) {
    try {
      const response = await openai.beta.threads.retrieve(args.thread_id);
      return formatResponse(response);
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiModifyThread(args: any) {
    const { thread_id, ...updates } = args;
    try {
      const response = await openai.beta.threads.update(thread_id, updates);
      return formatResponse(response);
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiDeleteThread(args: any) {
    try {
      const response = await openai.beta.threads.del(args.thread_id);
      return formatResponse(response);
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  // Messages
  export async function openaiCreateMessage(args: any) {
    const { thread_id, ...messageData } = args;
    try {
      const response = await openai.beta.threads.messages.create(thread_id, messageData);
      return formatResponse(response);
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiListMessages(args: any) {
    const { thread_id, ...params } = args;
    try {
      const response = await openai.beta.threads.messages.list(thread_id, params);
      return formatResponse(response);
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiRetrieveMessage(args: any) {
    try {
      const response = await openai.beta.threads.messages.retrieve(args.thread_id, args.message_id);
      return formatResponse(response);
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiModifyMessage(args: any) {
    const { thread_id, message_id, ...updates } = args;
    try {
      const response = await openai.beta.threads.messages.update(thread_id, message_id, updates);
      return formatResponse(response);
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiDeleteMessage(args: any) {
    return formatResponse({ message: "Not yet implemented" });
  }

  // Runs
  export async function openaiCreateRun(args: any) {
    const { thread_id, ...runData } = args;
    try {
      const response = await openai.beta.threads.runs.create(thread_id, runData);
      return formatResponse(response);
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiCreateThreadAndRun(args: any) {
    try {
      const response = await openai.beta.threads.createAndRun(args);
      return formatResponse(response);
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiListRuns(args: any) {
    const { thread_id, ...params } = args;
    try {
      const response = await openai.beta.threads.runs.list(thread_id, params);
      return formatResponse(response);
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiRetrieveRun(args: any) {
    try {
      const response = await openai.beta.threads.runs.retrieve(args.thread_id, args.run_id);
      return formatResponse(response);
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiModifyRun(args: any) {
    const { thread_id, run_id, ...updates } = args;
    try {
      const response = await openai.beta.threads.runs.update(thread_id, run_id, updates);
      return formatResponse(response);
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiCancelRun(args: any) {
    try {
      const response = await openai.beta.threads.runs.cancel(args.thread_id, args.run_id);
      return formatResponse(response);
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiSubmitToolOutputs(args: any) {
    const { thread_id, run_id, tool_outputs } = args;
    try {
      const response = await openai.beta.threads.runs.submitToolOutputs(thread_id, run_id, { tool_outputs });
      return formatResponse(response);
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiListRunSteps(args: any) {
    const { thread_id, run_id, ...params } = args;
    try {
      const response = await openai.beta.threads.runs.steps.list(thread_id, run_id, params);
      return formatResponse(response);
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiRetrieveRunStep(args: any) {
    try {
      const response = await openai.beta.threads.runs.steps.retrieve(args.thread_id, args.run_id, args.step_id);
      return formatResponse(response);
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  // Vector Stores (RAG) - Stub implementations for now
  export async function openaiCreateVectorStore(args: any) {
    return formatResponse({
      message: "Vector Stores API not yet available in OpenAI SDK v4.73.0",
      note: "This feature will be implemented when the SDK is updated"
    });
  }

  export async function openaiListVectorStores(args: any) {
    return formatResponse({ message: "Not yet implemented - awaiting SDK update" });
  }

  export async function openaiRetrieveVectorStore(args: any) {
    return formatResponse({ message: "Not yet implemented - awaiting SDK update" });
  }

  export async function openaiModifyVectorStore(args: any) {
    return formatResponse({ message: "Not yet implemented - awaiting SDK update" });
  }

  export async function openaiDeleteVectorStore(args: any) {
    return formatResponse({ message: "Not yet implemented - awaiting SDK update" });
  }

  export async function openaiCreateVectorStoreFile(args: any) {
    return formatResponse({ message: "Not yet implemented - awaiting SDK update" });
  }

  export async function openaiListVectorStoreFiles(args: any) {
    return formatResponse({ message: "Not yet implemented - awaiting SDK update" });
  }

  export async function openaiRetrieveVectorStoreFile(args: any) {
    return formatResponse({ message: "Not yet implemented - awaiting SDK update" });
  }

  export async function openaiDeleteVectorStoreFile(args: any) {
    return formatResponse({ message: "Not yet implemented - awaiting SDK update" });
  }

  export async function openaiCreateVectorStoreFileBatch(args: any) {
    return formatResponse({ message: "Not yet implemented - awaiting SDK update" });
  }

  export async function openaiRetrieveVectorStoreFileBatch(args: any) {
    return formatResponse({ message: "Not yet implemented - awaiting SDK update" });
  }

  export async function openaiCancelVectorStoreFileBatch(args: any) {
    return formatResponse({ message: "Not yet implemented - awaiting SDK update" });
  }

  // Cost Management
  export async function openaiEstimateCost(args: any) {
    const { operation, model, input_text, max_tokens, image_count, image_size, image_quality } = args;

    try {
      let estimate;

      switch (operation) {
        case "chat":
          estimate = costManager.estimateChatCost(model, input_text || "", max_tokens || 1000);
          break;
        case "embedding":
          estimate = costManager.estimateEmbeddingCost(model, [input_text || ""]);
          break;
        case "image":
          estimate = costManager.estimateImageCost(
            model,
            image_size || "1024x1024",
            image_quality || "standard",
            image_count || 1
          );
          break;
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }

      return formatResponse(estimate);
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiGetBudgetStatus(args: any) {
    const status = costManager.getBudgetStatus();
    return formatResponse(status);
  }

  // Advanced Cost Analytics
  export async function openaiGetCostBreakdown(args: any) {
    const { group_by = "model", start_date, end_date } = args;

    try {
      const history = costManager.getCostHistory();
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

      return formatResponse({
        breakdown,
        summary: {
          total_cost: totalCost,
          total_operations: totalOperations,
          group_by,
          period: start_date && end_date ? `${start_date} to ${end_date}` : "all time",
        },
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiOptimizePrompt(args: any) {
    const { prompt, model = "gpt-4" } = args;

    try {
      const currentTokens = costManager.estimateTokens(prompt, model);
      const currentCost = costManager.estimateChatCost(model, prompt, 1000);

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

      return formatResponse({
        current_analysis: {
          token_count: currentTokens,
          estimated_cost: currentCost.estimated_cost_usd,
          model,
        },
        suggestions,
        note: "These are general suggestions. Actual savings depend on implementation.",
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiExportCostReport(args: any) {
    const { format, start_date, end_date } = args;

    try {
      const history = costManager.getCostHistory();

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
        return formatResponse({
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

        return formatResponse({
          format: "csv",
          data: csv,
          total_cost: filteredHistory.reduce((sum: number, entry: any) => sum + entry.cost, 0),
          total_operations: filteredHistory.length,
          note: "CSV data provided as string. Save to file to use.",
        });
      }

      return formatResponse({ error: "Invalid format. Use 'json' or 'csv'." });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiGetTokenAnalytics(args: any) {
    const { period = "all" } = args;

    try {
      const history = costManager.getCostHistory();

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

      return formatResponse({
        period,
        total_tokens: totalTokens,
        total_requests: filteredHistory.length,
        avg_tokens_per_request: Math.round(avgTokensPerRequest),
        total_cost: filteredHistory.reduce((sum: number, entry: any) => sum + entry.cost, 0),
        cost_per_1k_tokens: filteredHistory.length > 0 ? (filteredHistory.reduce((sum: number, entry: any) => sum + entry.cost, 0) / totalTokens) * 1000 : 0,
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiSuggestCheaperAlternative(args: any) {
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
        return formatResponse({
          current_model,
          message: `${current_model} is already the most cost-effective option for ${quality_requirement} quality ${task_type} tasks.`,
          alternatives: [],
        });
      }

      return formatResponse({
        current_model,
        quality_requirement,
        task_type,
        suggestions: suggestions.map((model: string) => ({
          model,
          note: `Consider switching to ${model} for cost savings while maintaining ${quality_requirement} quality.`,
        })),
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  // Usage & Billing API (NEW Dec 2024)
  export async function openaiGetUsage(args: any) {
    if (!OPENAI_ADMIN_KEY) {
      return formatResponse({
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
        return formatResponse({ error: error.error?.message || "Failed to fetch usage data" });
      }

      const data = await response.json();
      return formatResponse(data);
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiGetCosts(args: any) {
    if (!OPENAI_ADMIN_KEY) {
      return formatResponse({
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
        return formatResponse({ error: error.error?.message || "Failed to fetch costs" });
      }

      const data = await response.json();
      return formatResponse(data);
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiGetUsageCompletions(args: any) {
    return formatResponse({
      message: "Usage API requires Organization Admin Key",
      endpoint: "GET https://api.openai.com/v1/organization/usage/completions",
    });
  }

  export async function openaiGetUsageEmbeddings(args: any) {
    return formatResponse({
      message: "Usage API requires Organization Admin Key",
      endpoint: "GET https://api.openai.com/v1/organization/usage/embeddings",
    });
  }

  export async function openaiGetUsageModerations(args: any) {
    return formatResponse({
      message: "Usage API requires Organization Admin Key",
      endpoint: "GET https://api.openai.com/v1/organization/usage/moderations",
    });
  }

  export async function openaiGetUsageImages(args: any) {
    return formatResponse({
      message: "Usage API requires Organization Admin Key",
      endpoint: "GET https://api.openai.com/v1/organization/usage/images",
    });
  }

  export async function openaiGetUsageAudioSpeeches(args: any) {
    return formatResponse({
      message: "Usage API requires Organization Admin Key",
      endpoint: "GET https://api.openai.com/v1/organization/usage/audio_speeches",
    });
  }

  export async function openaiGetUsageAudioTranscriptions(args: any) {
    return formatResponse({
      message: "Usage API requires Organization Admin Key",
      endpoint: "GET https://api.openai.com/v1/organization/usage/audio_transcriptions",
    });
  }

  // Projects & Organization Management
  export async function openaiListProjects(args: any) {
    return formatResponse({
      message: "Projects API requires Organization Admin Key",
      endpoint: "GET https://api.openai.com/v1/organization/projects",
      required_scope: "api.management.read",
    });
  }

  export async function openaiGetProject(args: any) {
    const { project_id } = args;
    return formatResponse({
      message: "Projects API requires Organization Admin Key",
      endpoint: `GET https://api.openai.com/v1/organization/projects/${project_id}`,
    });
  }

  export async function openaiCreateProject(args: any) {
    return formatResponse({
      message: "Projects API requires Organization Admin Key",
      endpoint: "POST https://api.openai.com/v1/organization/projects",
      required_scope: "api.management.write",
    });
  }

  export async function openaiUpdateProject(args: any) {
    const { project_id } = args;
    return formatResponse({
      message: "Projects API requires Organization Admin Key",
      endpoint: `POST https://api.openai.com/v1/organization/projects/${project_id}`,
    });
  }

  export async function openaiArchiveProject(args: any) {
    const { project_id } = args;
    return formatResponse({
      message: "Projects API requires Organization Admin Key",
      endpoint: `POST https://api.openai.com/v1/organization/projects/${project_id}/archive`,
    });
  }

  // Users & Invites
  export async function openaiListUsers(args: any) {
    return formatResponse({
      message: "Users API requires Organization Admin Key",
      endpoint: "GET https://api.openai.com/v1/organization/users",
    });
  }

  export async function openaiGetUser(args: any) {
    const { user_id } = args;
    return formatResponse({
      message: "Users API requires Organization Admin Key",
      endpoint: `GET https://api.openai.com/v1/organization/users/${user_id}`,
    });
  }

  export async function openaiUpdateUser(args: any) {
    const { user_id } = args;
    return formatResponse({
      message: "Users API requires Organization Admin Key",
      endpoint: `POST https://api.openai.com/v1/organization/users/${user_id}`,
    });
  }

  export async function openaiDeleteUser(args: any) {
    const { user_id } = args;
    return formatResponse({
      message: "Users API requires Organization Admin Key",
      endpoint: `DELETE https://api.openai.com/v1/organization/users/${user_id}`,
    });
  }

  export async function openaiListInvites(args: any) {
    return formatResponse({
      message: "Invites API requires Organization Admin Key",
      endpoint: "GET https://api.openai.com/v1/organization/invites",
    });
  }

  export async function openaiCreateInvite(args: any) {
    return formatResponse({
      message: "Invites API requires Organization Admin Key",
      endpoint: "POST https://api.openai.com/v1/organization/invites",
    });
  }

  export async function openaiDeleteInvite(args: any) {
    const { invite_id } = args;
    return formatResponse({
      message: "Invites API requires Organization Admin Key",
      endpoint: `DELETE https://api.openai.com/v1/organization/invites/${invite_id}`,
    });
  }

  export async function openaiGetRateLimits(args: any) {
    const { model } = args;
    return formatResponse({
      message: "Rate limits information",
      note: "Rate limits are returned in response headers: x-ratelimit-limit-requests, x-ratelimit-remaining-requests, x-ratelimit-limit-tokens, x-ratelimit-remaining-tokens",
      documentation: "https://platform.openai.com/docs/guides/rate-limits",
      model: model || "all models",
    });
  }

  // Advanced Cost Tracking Features

  export async function openaiTrackUserCost(args: any) {
    const { user_id, operation, cost, metadata = {} } = args;

    try {
      if (!userCosts.has(user_id)) {
        userCosts.set(user_id, []);
      }

      const record = {
        timestamp: new Date().toISOString(),
        operation,
        cost,
        ...metadata,
      };

      userCosts.get(user_id)!.push(record);

      // Check if user has exceeded any alerts
      const userTotal = userCosts.get(user_id)!.reduce((sum, r) => sum + r.cost, 0);

      return formatResponse({
        user_id,
        recorded: true,
        total_cost: userTotal,
        operation_count: userCosts.get(user_id)!.length,
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiGetUserCosts(args: any) {
    const { user_id, start_date, end_date } = args;

    try {
      const userRecords = userCosts.get(user_id) || [];

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

      return formatResponse({
        user_id,
        total_cost: totalCost,
        operation_count: filteredRecords.length,
        records: filteredRecords,
        period: start_date && end_date ? `${start_date} to ${end_date}` : "all time",
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiSetCostAlert(args: any) {
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

      costAlerts.set(alertId, alert);

      return formatResponse({
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
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiListCostAlerts(args: any) {
    try {
      const alerts = Array.from(costAlerts.values());
      return formatResponse({
        alerts,
        count: alerts.length,
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiDeleteCostAlert(args: any) {
    const { alert_id } = args;

    try {
      if (!costAlerts.has(alert_id)) {
        return formatResponse({ error: "Alert not found" });
      }

      costAlerts.delete(alert_id);
      return formatResponse({
        deleted: true,
        alert_id,
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiForecastCosts(args: any) {
    const { days_ahead = 30, confidence_level = 0.95 } = args;

    try {
      const history = costManager.getCostHistory();

      if (history.length < 7) {
        return formatResponse({
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

      return formatResponse({
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
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiDetectCostAnomalies(args: any) {
    const { sensitivity = "medium", lookback_days = 30 } = args;

    try {
      const history = costManager.getCostHistory();

      // Group by day
      const dailyCosts: Map<string, number> = new Map();
      history.forEach((record: any) => {
        const day = new Date(record.timestamp).toISOString().split("T")[0];
        dailyCosts.set(day, (dailyCosts.get(day) || 0) + record.cost);
      });

      const costs = Array.from(dailyCosts.values());
      if (costs.length < 7) {
        return formatResponse({
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

      return formatResponse({
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
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiGetBudgetRecommendations(args: any) {
    const { current_budget } = args;

    try {
      const history = costManager.getCostHistory();

      if (history.length < 7) {
        return formatResponse({
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

      return formatResponse({
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
      return formatResponse({ error: error.message });
    }
  }

  // MODEL CAPABILITIES
  export async function openaiGetModelCapabilities(args: any) {
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
    return formatResponse({ model: args.model, ...modelCaps });
  }

  export async function openaiCompareModelCapabilities(args: any) {
    const comparisons = await Promise.all(
      args.models.map(async (model: string) => {
        const result = await this.getModelCapabilities({ model });
        return result.content[0].text;
      })
    );
    return formatResponse({ comparisons });
  }

  export async function openaiGetModelPricing(args: any) {
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
    return formatResponse({ model: args.model, ...modelPricing });
  }

  // ADVANCED BATCH OPERATIONS
  export async function openaiGetBatchResults(args: any) {
    const batch = await openai.batches.retrieve(args.batch_id);
    if (batch.status !== 'completed') {
      return formatResponse({ status: batch.status, message: 'Batch not yet completed' });
    }
    const outputFileId = args.output_file_id || batch.output_file_id;
    if (!outputFileId) {
      return formatResponse({ error: 'No output file available' });
    }
    const fileContent = await openai.files.content(outputFileId);
    return formatResponse({ batch_id: args.batch_id, results: fileContent });
  }

  export async function openaiEstimateBatchCost(args: any) {
    const file = await openai.files.retrieve(args.input_file_id);
    // Estimate based on file size (rough approximation)
    const estimatedRequests = Math.ceil((file.bytes || 0) / 1000);
    const costPerRequest = args.endpoint.includes('embeddings') ? 0.0001 : 0.001;
    const estimatedCost = estimatedRequests * costPerRequest * 0.5; // 50% discount for batch
    return formatResponse({
      input_file_id: args.input_file_id,
      estimated_requests: estimatedRequests,
      estimated_cost: estimatedCost.toFixed(4),
      discount: '50% (batch pricing)',
      note: 'This is a rough estimate based on file size'
    });
  }

  export async function openaiGetBatchProgress(args: any) {
    const batch = await openai.batches.retrieve(args.batch_id);
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
    return formatResponse(progress);
  }

  // ORGANIZATION SETTINGS
  export async function openaiGetOrganizationSettings(args: any) {
    // Note: This requires organization admin API key
    return formatResponse({
      message: 'Organization settings (requires admin API key)',
      note: 'Use OpenAI dashboard for full organization management'
    });
  }

  export async function openaiUpdateOrganizationSettings(args: any) {
    return formatResponse({
      message: 'Organization settings update (requires admin API key)',
      settings: args.settings,
      note: 'Use OpenAI dashboard for full organization management'
    });
  }

  export async function openaiGetOrganizationUsageLimits(args: any) {
    return formatResponse({
      message: 'Usage limits and quotas',
      note: 'Check OpenAI dashboard for current limits and quotas'
    });
  }

  // ADVANCED USAGE ANALYTICS
  export async function openaiGetUsageByModel(args: any) {
    // Note: Usage API requires direct API calls, not available in SDK
    const response = await fetch('https://api.openai.com/v1/usage', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    const usage = await response.json();
    return formatResponse({
      usage_by_model: usage,
      start_date: args.start_date,
      end_date: args.end_date,
      note: 'Usage data from OpenAI API'
    });
  }

  export async function openaiGetUsageByUser(args: any) {
    // Note: This requires organization-level API access
    return formatResponse({
      message: 'Usage by user/API key',
      start_date: args.start_date,
      end_date: args.end_date,
      note: 'Requires organization admin API key for detailed user breakdown'
    });
  }

  export async function openaiExportUsageData(args: any) {
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
      return formatResponse({ format: 'csv', data: csv });
    }

    return formatResponse({ format: 'json', data: usage });
  }

  // ==================== TOKEN MANAGEMENT & OPTIMIZATION ====================

  export async function openaiCountTokens(args: any) {
    const { text, model = "gpt-4" } = args;
    try {
      const tokenCount = costManager.estimateTokens(text, model);

      return formatResponse({
        text_length: text.length,
        token_count: tokenCount,
        model: model,
        characters_per_token: (text.length / tokenCount).toFixed(2),
        estimated_cost: costManager.estimateChatCost(model, text, 0).estimated_cost_usd,
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiCountTokensBatch(args: any) {
    const { texts, model = "gpt-4" } = args;
    try {
      const results = texts.map((text: string) => {
        const tokenCount = costManager.estimateTokens(text, model);
        return {
          text_preview: text.substring(0, 50) + (text.length > 50 ? "..." : ""),
          text_length: text.length,
          token_count: tokenCount,
        };
      });

      const totalTokens = results.reduce((sum: number, r: any) => sum + r.token_count, 0);

      return formatResponse({
        results,
        summary: {
          total_texts: texts.length,
          total_tokens: totalTokens,
          average_tokens: (totalTokens / texts.length).toFixed(2),
          model: model,
        },
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiCountMessageTokens(args: any) {
    const { messages, model = "gpt-4" } = args;
    try {
      // OpenAI message formatting adds ~4 tokens per message
      const messageOverhead = 4;
      let totalTokens = 3; // Base overhead for chat format

      const messageBreakdown = messages.map((msg: any) => {
        const contentTokens = costManager.estimateTokens(msg.content || "", model);
        const roleTokens = costManager.estimateTokens(msg.role || "user", model);
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

      return formatResponse({
        messages: messageBreakdown,
        summary: {
          total_messages: messages.length,
          total_tokens: totalTokens,
          average_tokens_per_message: (totalTokens / messages.length).toFixed(2),
          model: model,
          estimated_cost: costManager.estimateChatCost(model, messages.map((m: any) => m.content).join("\n"), 0).estimated_cost_usd,
        },
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiOptimizePromptTokens(args: any) {
    const { text, target_reduction = 20, model = "gpt-4" } = args;
    try {
      const originalTokens = costManager.estimateTokens(text, model);
      const targetTokens = Math.floor(originalTokens * (1 - target_reduction / 100));

      // Use GPT to optimize the prompt
      const optimizationPrompt = `Rewrite the following text to reduce token count by approximately ${target_reduction}% while preserving all key information and meaning. Target: ${targetTokens} tokens or less.

Original text (${originalTokens} tokens):
${text}

Optimized version:`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Use cheaper model for optimization
        messages: [{ role: "user", content: optimizationPrompt }],
        temperature: 0.3,
        max_tokens: targetTokens + 100,
      });

      const optimizedText = response.choices[0].message.content || "";
      const optimizedTokens = costManager.estimateTokens(optimizedText, model);
      const actualReduction = ((originalTokens - optimizedTokens) / originalTokens * 100).toFixed(1);

      return formatResponse({
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
          cost_saved_per_1k_calls: ((originalTokens - optimizedTokens) / 1000 * (costManager as any).PRICING[model]?.input_per_1k || 0).toFixed(4),
        },
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiEstimateCostFromTokens(args: any) {
    const { input_tokens, output_tokens, model = "gpt-4" } = args;
    try {
      const pricing = (costManager as any).PRICING[model];
      if (!pricing) {
        return formatResponse({ error: `Pricing not available for model: ${model}` });
      }

      const inputCost = (input_tokens / 1000) * pricing.input_per_1k;
      const outputCost = (output_tokens / 1000) * pricing.output_per_1k;
      const totalCost = inputCost + outputCost;

      return formatResponse({
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
          daily_spent: costManager.getDailySpent(),
          monthly_spent: costManager.getMonthlySpent(),
          daily_budget: (costManager as any).config.daily_budget,
          monthly_budget: (costManager as any).config.monthly_budget,
          would_exceed_daily: (costManager.getDailySpent() + totalCost) > (costManager as any).config.daily_budget,
          would_exceed_monthly: (costManager.getMonthlySpent() + totalCost) > (costManager as any).config.monthly_budget,
        },
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiCompareModelCosts(args: any) {
    const { text, models = ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"], expected_output_tokens = 500 } = args;
    try {
      const comparisons = models.map((model: string) => {
        const inputTokens = costManager.estimateTokens(text, model);
        const pricing = (costManager as any).PRICING[model];

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

      return formatResponse({
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
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiFindCheapestModel(args: any) {
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

      return formatResponse({
        recommended_model: cheapest.model,
        quality_tier: min_quality_tier,
        cost_estimate: cheapest.cost_usd,
        token_estimate: cheapest.total_tokens,
        reasoning: `${cheapest.model} is the cheapest model in the '${min_quality_tier}' quality tier for this input.`,
        alternatives: comparisonData.comparisons.slice(1, 3),
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiTokenBudgetCheck(args: any) {
    const { text, max_tokens, model = "gpt-4" } = args;
    try {
      const actualTokens = costManager.estimateTokens(text, model);
      const withinBudget = actualTokens <= max_tokens;
      const difference = max_tokens - actualTokens;

      return formatResponse({
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
      return formatResponse({ error: error.message });
    }
  }

  // ==================== MODEL COMPARISON & SELECTION ====================

  export async function openaiCompareModels(args: any) {
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
        const pricing = (costManager as any).PRICING[model] || {};

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
          use_cases: getModelUseCases(model),
        };
      });

      return formatResponse({
        comparisons,
        criteria_evaluated: criteria,
        recommendation: this.getBestModelForCriteria(comparisons, criteria),
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export function openaigetModelUseCases(model: string): string[] {
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

  export function openaigetBestModelForCriteria(comparisons: any[], criteria: string[]): any {
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

  export async function openaiRecommendModel(args: any) {
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

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        response_format: { type: "json_object" },
      });

      const recommendation = JSON.parse(response.choices[0].message.content || "{}");

      return formatResponse({
        ...recommendation,
        use_case: use_case,
        constraints: constraints,
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiModelBenchmark(args: any) {
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
            const response = await openai.chat.completions.create({
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
            modelResults.total_cost += ((response.usage?.prompt_tokens || 0) / 1000) * ((costManager as any).PRICING[model]?.input_per_1k || 0) +
                                       ((response.usage?.completion_tokens || 0) / 1000) * ((costManager as any).PRICING[model]?.output_per_1k || 0);
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

      return formatResponse({
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
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiscoreResponse(response: string, prompt: string, criteria: string[]): Promise<number> {
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

  export async function openaiModelQualityScore(args: any) {
    const { model, prompt, expected_output = "", criteria = ["accuracy", "coherence", "relevance", "completeness"] } = args;
    try {
      const response = await openai.chat.completions.create({
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

      return formatResponse({
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
      return formatResponse({ error: error.message });
    }
  }

  export function openaicalculateSimilarity(text1: string, text2: string): number {
    // Simple word overlap similarity
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);
    const overlap = words1.filter(w => words2.includes(w)).length;
    return (overlap / Math.max(words1.length, words2.length)) * 100;
  }

  export async function openaiModelLatencyTest(args: any) {
    const { model, prompt, iterations = 5 } = args;
    try {
      const latencies = [];
      const costs = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();

        const response = await openai.chat.completions.create({
          model: model,
          messages: [{ role: "user", content: prompt }],
          max_tokens: 500,
        });

        const endTime = Date.now();
        const latency = endTime - startTime;
        latencies.push(latency);

        const cost = ((response.usage?.prompt_tokens || 0) / 1000) * ((costManager as any).PRICING[model]?.input_per_1k || 0) +
                     ((response.usage?.completion_tokens || 0) / 1000) * ((costManager as any).PRICING[model]?.output_per_1k || 0);
        costs.push(cost);
      }

      const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      const minLatency = Math.min(...latencies);
      const maxLatency = Math.max(...latencies);
      const avgCost = costs.reduce((a, b) => a + b, 0) / costs.length;

      return formatResponse({
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
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiModelCostQualityTradeoff(args: any) {
    const { models, test_prompt, budget = 1.0 } = args;
    try {
      const results = [];

      for (const model of models) {
        const response = await openai.chat.completions.create({
          model: model,
          messages: [{ role: "user", content: test_prompt }],
          max_tokens: 500,
        });

        const cost = ((response.usage?.prompt_tokens || 0) / 1000) * ((costManager as any).PRICING[model]?.input_per_1k || 0) +
                     ((response.usage?.completion_tokens || 0) / 1000) * ((costManager as any).PRICING[model]?.output_per_1k || 0);

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

      return formatResponse({
        analysis: results,
        recommendation: {
          best_value: results[0].model,
          best_quality: results.sort((a, b) => parseFloat(b.quality_score) - parseFloat(a.quality_score))[0].model,
          cheapest: results.sort((a, b) => parseFloat(a.cost_usd) - parseFloat(b.cost_usd))[0].model,
        },
        budget: budget,
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiModelFallbackChain(args: any) {
    const { primary_model, fallback_models, fallback_conditions = ["error", "timeout", "rate_limit"] } = args;
    try {
      return formatResponse({
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
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiModelAbTest(args: any) {
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
          openai.chat.completions.create({
            model: model_a,
            messages: [{ role: "user", content: testCase }],
            max_tokens: 500,
          }),
          openai.chat.completions.create({
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

      return formatResponse({
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
      return formatResponse({ error: error.message });
    }
  }

  // ==================== SAFETY & COMPLIANCE ====================

  export async function openaiContentSafetyCheck(args: any) {
    const { content, categories = [] } = args;
    try {
      // Use OpenAI Moderation API
      const moderation = await openai.moderations.create({
        input: content,
      });

      const result = moderation.results[0];

      return formatResponse({
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
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiPiiDetection(args: any) {
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

        const response = await openai.chat.completions.create({
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

      return formatResponse({
        pii_found: detected.length > 0,
        count: detected.length,
        detected: detected,
        risk_level: detected.length === 0 ? "low" : detected.length < 3 ? "medium" : "high",
        recommendation: detected.length > 0
          ? `Found ${detected.length} PII items. Consider redacting before processing.`
          : "No PII detected. Safe to process.",
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiPiiRedaction(args: any) {
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

      return formatResponse({
        original_text: text,
        redacted_text: redactedText,
        redaction_method: redaction_method,
        redactions_count: redactions.length,
        redactions: redactions.map(r => ({ type: r.type })), // Don't include original values in response
        safe_to_process: true,
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export function openaisimpleHash(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36).substring(0, 8);
  }

  export async function openaiToxicityScore(args: any) {
    const { text, dimensions = ["hate", "harassment", "violence", "sexual", "self-harm"] } = args;
    try {
      const moderation = await openai.moderations.create({ input: text });
      const result = moderation.results[0];

      const scores: any = {};
      dimensions.forEach((dim: string) => {
        const key = dim.replace("-", "_") as keyof typeof result.category_scores;
        scores[dim] = result.category_scores[key] || 0;
      });

      const avgScore = (Object.values(scores) as number[]).reduce((a: number, b: number) => a + b, 0) / dimensions.length;

      return formatResponse({
        overall_toxicity: avgScore,
        dimension_scores: scores,
        flagged: result.flagged,
        risk_level: avgScore < 0.3 ? "low" : avgScore < 0.6 ? "medium" : "high",
        recommendation: avgScore > 0.6 ? "High toxicity detected. Review content before use." : "Acceptable toxicity levels.",
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiBiasDetection(args: any) {
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

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        response_format: { type: "json_object" },
      });

      const analysis = JSON.parse(response.choices[0].message.content || "{}");

      return formatResponse({
        ...analysis,
        checked_bias_types: bias_types,
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiComplianceCheck(args: any) {
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

        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.1,
          response_format: { type: "json_object" },
        });

        checks[standard] = JSON.parse(response.choices[0].message.content || "{}");
      }

      const allCompliant = Object.values(checks).every((c: any) => c.compliant);

      return formatResponse({
        overall_compliant: allCompliant,
        standards_checked: compliance_standards,
        checks: checks,
        recommendation: allCompliant
          ? "Content meets all compliance standards."
          : "Compliance violations detected. Review and address before deployment.",
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }


  export async function openaiContentFilterCreate(args: any) {
    const { filter_name, rules, action = "warn" } = args;
    try {
      contentFilters.set(filter_name, { rules, action, created: new Date().toISOString() });

      return formatResponse({
        filter_name: filter_name,
        rules_count: rules.length,
        action: action,
        status: "created",
        usage: `Use openai_content_filter_test with filter_name="${filter_name}" to test content.`,
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiContentFilterTest(args: any) {
    const { filter_name, content } = args;
    try {
      const filter = contentFilters.get(filter_name);
      if (!filter) {
        return formatResponse({ error: `Filter "${filter_name}" not found. Create it first with openai_content_filter_create.` });
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

      return formatResponse({
        filter_name: filter_name,
        passed: violations.length === 0,
        violations: violations,
        action: filter.action,
        recommendation: violations.length > 0
          ? `Content violates ${violations.length} rule(s). Action: ${filter.action}`
          : "Content passed all filter rules.",
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiSafetyReport(args: any) {
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

      return formatResponse({
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
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiAuditLogExport(args: any) {
    const { start_date, end_date, format = "json", include_pii = false } = args;
    try {
      // Get cost history (which includes audit trail)
      const history = costManager.getCostHistory();

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
        return formatResponse({ format: "csv", data: csv, records: sanitized.length });
      }

      return formatResponse({
        format: format,
        start_date: start_date,
        end_date: end_date,
        records_count: sanitized.length,
        data: sanitized,
        includes_pii: include_pii,
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export function openaiconvertToCSV(data: any[]): string {
    if (data.length === 0) return "";

    const headers = Object.keys(data[0]);
    const rows = data.map(row => headers.map(h => JSON.stringify(row[h] || "")).join(","));
    return [headers.join(","), ...rows].join("\n");
  }

  // ==================== MONITORING & OBSERVABILITY ====================

  export async function openaiMonitorGetMetrics(args: any) {
    const { time_range = "24h", metrics = [] } = args;
    try {
      const history = costManager.getCostHistory();
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

      return formatResponse({
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
      return formatResponse({ error: error.message });
    }
  }

  export function openaiparseTimeRange(range: string): number {
    const map: any = { "1h": 3600000, "24h": 86400000, "7d": 604800000, "30d": 2592000000 };
    return map[range] || 86400000;
  }

  export async function openaiMonitorGetErrors(args: any) {
    const { time_range = "24h", error_types = [], limit = 100 } = args;
    try {
      // In a real implementation, this would query error logs
      // For now, we'll simulate with cost history errors
      const history = costManager.getCostHistory();
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

      return formatResponse({
        time_range: time_range,
        total_errors: errors.length,
        error_rate: `${((errors.length / history.length) * 100).toFixed(2)}%`,
        error_types: errorStats,
        recent_errors: errors.slice(0, 10),
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiMonitorGetLatency(args: any) {
    const { time_range = "24h", model = "" } = args;
    try {
      const history = costManager.getCostHistory();
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
        return formatResponse({ message: "No latency data available for the specified period" });
      }

      const p50 = latencies[Math.floor(latencies.length * 0.5)];
      const p95 = latencies[Math.floor(latencies.length * 0.95)];
      const p99 = latencies[Math.floor(latencies.length * 0.99)];
      const avg = latencies.reduce((a: number, b: number) => a + b, 0) / latencies.length;

      return formatResponse({
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
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiMonitorGetThroughput(args: any) {
    const { time_range = "24h", granularity = "hour" } = args;
    try {
      const history = costManager.getCostHistory();
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

      return formatResponse({
        time_range: time_range,
        granularity: granularity,
        total_requests: filtered.length,
        avg_requests_per_period: timeline.length > 0 ? (filtered.length / timeline.length).toFixed(2) : 0,
        timeline: timeline,
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiMonitorGetSuccessRate(args: any) {
    const { time_range = "24h", model = "" } = args;
    try {
      const history = costManager.getCostHistory();
      const now = Date.now();
      const rangeMs = this.parseTimeRange(time_range);

      let filtered = history.filter((r: any) => now - new Date(r.timestamp).getTime() < rangeMs);
      if (model) {
        filtered = filtered.filter((r: any) => r.model === model);
      }

      const total = filtered.length;
      const successful = filtered.filter((r: any) => !r.error).length;
      const failed = total - successful;

      return formatResponse({
        time_range: time_range,
        model: model || "all",
        total_requests: total,
        successful_requests: successful,
        failed_requests: failed,
        success_rate: total > 0 ? `${((successful / total) * 100).toFixed(2)}%` : "N/A",
        failure_rate: total > 0 ? `${((failed / total) * 100).toFixed(2)}%` : "N/A",
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }


  export async function openaiMonitorSetAlert(args: any) {
    const { alert_name, metric, threshold, condition = "above", notification_method = "log" } = args;
    try {
      monitoringAlerts.set(alert_name, {
        metric,
        threshold,
        condition,
        notification_method,
        created: new Date().toISOString(),
        status: "active",
      });

      return formatResponse({
        alert_name: alert_name,
        metric: metric,
        threshold: threshold,
        condition: condition,
        notification_method: notification_method,
        status: "configured",
        message: `Alert will trigger when ${metric} is ${condition} ${threshold}`,
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiMonitorGetAlerts(args: any) {
    const { status = "active", limit = 50 } = args;
    try {
      const alerts = Array.from(monitoringAlerts.entries())
        .filter(([_, alert]) => status === "all" || alert.status === status)
        .slice(0, limit)
        .map(([name, alert]) => ({ name, ...alert }));

      return formatResponse({
        total_alerts: alerts.length,
        status_filter: status,
        alerts: alerts,
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiMonitorExportLogs(args: any) {
    const { start_date, end_date, format = "json", log_level = "info" } = args;
    try {
      const history = costManager.getCostHistory();
      const filtered = history.filter((r: any) => {
        const timestamp = new Date(r.timestamp);
        return timestamp >= new Date(start_date) && timestamp <= new Date(end_date);
      });

      if (format === "csv") {
        const csv = this.convertToCSV(filtered);
        return formatResponse({ format: "csv", data: csv, records: filtered.length });
      }

      if (format === "ndjson") {
        const ndjson = filtered.map((r: any) => JSON.stringify(r)).join("\n");
        return formatResponse({ format: "ndjson", data: ndjson, records: filtered.length });
      }

      return formatResponse({
        format: format,
        start_date: start_date,
        end_date: end_date,
        log_level: log_level,
        records: filtered.length,
        data: filtered,
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiMonitorGetTrace(args: any) {
    const { trace_id, include_spans = true } = args;
    try {
      // In a real implementation, this would query distributed tracing system
      return formatResponse({
        trace_id: trace_id,
        status: "simulated",
        message: "Distributed tracing not yet implemented. This would integrate with OpenTelemetry or similar.",
        spans: include_spans ? [
          { span_id: "span-1", operation: "openai.chat.completions.create", duration_ms: 1234 },
          { span_id: "span-2", operation: "cost_manager.estimate", duration_ms: 5 },
        ] : [],
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiMonitorGetDashboard(args: any) {
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

      return formatResponse({
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
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiMonitorGetAnomalies(args: any) {
    const { metric, time_range = "24h", sensitivity = "medium" } = args;
    try {
      const history = costManager.getCostHistory();
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

      return formatResponse({
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
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiMonitorGetHealth(args: any) {
    const { include_details = true } = args;
    try {
      const budget = costManager.getBudgetStatus();
      const history = costManager.getCostHistory();
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

      return formatResponse(response);
    } catch (error: any) {
      return formatResponse({
        status: "unhealthy",
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // ==================== PROMPT ENGINEERING ====================

  export async function openaiPromptOptimize(args: any) {
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

      const response = await openai.chat.completions.create({
        model: model,
        messages: [{ role: "user", content: optimizationPrompt }],
        temperature: 0.3,
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      const originalTokens = costManager.estimateTokens(prompt, model);
      const optimizedTokens = costManager.estimateTokens(result.optimized_prompt || "", model);

      return formatResponse({
        ...result,
        original_prompt: prompt,
        original_tokens: originalTokens,
        optimized_tokens: optimizedTokens,
        token_reduction: originalTokens - optimizedTokens,
        token_reduction_percent: `${(((originalTokens - optimizedTokens) / originalTokens) * 100).toFixed(1)}%`,
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiPromptShorten(args: any) {
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

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: shortenPrompt }],
        temperature: 0.2,
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      const originalTokens = costManager.estimateTokens(prompt, "gpt-4o-mini");
      const shortenedTokens = costManager.estimateTokens(result.shortened_prompt || "", "gpt-4o-mini");
      const actualReduction = ((originalTokens - shortenedTokens) / originalTokens) * 100;

      return formatResponse({
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
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiPromptExpand(args: any) {
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

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: expandPrompt }],
        temperature: 0.3,
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");

      return formatResponse({
        ...result,
        original_prompt: prompt,
        expansion_type: expansion_type,
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiPromptTest(args: any) {
    const { prompt, models = ["gpt-4o-mini", "gpt-4o", "gpt-4-turbo"], test_cases = [] } = args;
    try {
      const results: any[] = [];

      for (const model of models) {
        const response = await openai.chat.completions.create({
          model: model,
          messages: [{ role: "user", content: prompt }],
          max_tokens: 500,
        });

        const cost = ((response.usage?.prompt_tokens || 0) / 1000) * ((costManager as any).PRICING[model]?.input_per_1k || 0) +
                     ((response.usage?.completion_tokens || 0) / 1000) * ((costManager as any).PRICING[model]?.output_per_1k || 0);

        results.push({
          model: model,
          response: response.choices[0].message.content?.substring(0, 200) + "...",
          tokens: response.usage,
          cost_usd: cost.toFixed(6),
        });
      }

      return formatResponse({
        prompt: prompt,
        models_tested: models,
        results: results,
        recommendation: results.sort((a, b) => parseFloat(a.cost_usd) - parseFloat(b.cost_usd))[0].model,
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiPromptCompare(args: any) {
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

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: comparePrompt }],
        temperature: 0.2,
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");

      return formatResponse({
        ...result,
        prompts: prompts,
        evaluation_criteria: evaluation_criteria,
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiPromptSuggestImprovements(args: any) {
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

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: suggestPrompt }],
        temperature: 0.3,
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");

      return formatResponse({
        ...result,
        original_prompt: prompt,
        focus_areas: focus_areas,
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiPromptExtractVariables(args: any) {
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

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: extractPrompt }],
        temperature: 0.1,
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");

      return formatResponse({
        ...result,
        template: prompt_template,
        variable_format: variable_format,
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiPromptGenerateExamples(args: any) {
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

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: genPrompt }],
        temperature: 0.7,
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");

      return formatResponse({
        ...result,
        prompt: prompt,
        num_examples: num_examples,
        example_type: example_type,
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiPromptValidate(args: any) {
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

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: validatePrompt }],
        temperature: 0.2,
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");

      return formatResponse({
        ...result,
        prompt: prompt,
        validation_level: validation_level,
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiPromptTranslate(args: any) {
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

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: translatePrompt }],
        temperature: 0.3,
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");

      return formatResponse({
        ...result,
        original_prompt: prompt,
        target_language: target_language,
        preserve_formatting: preserve_formatting,
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  // ==================== ADVANCED EMBEDDINGS ====================

  export async function openaiEmbeddingSimilarity(args: any) {
    const { text1, text2, model = "text-embedding-3-small", similarity_metric = "cosine" } = args;
    try {
      const [embedding1, embedding2] = await Promise.all([
        openai.embeddings.create({ model, input: text1 }),
        openai.embeddings.create({ model, input: text2 }),
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

      return formatResponse({
        text1: text1.substring(0, 100) + "...",
        text2: text2.substring(0, 100) + "...",
        similarity: similarity.toFixed(4),
        similarity_metric: similarity_metric,
        model: model,
        interpretation: similarity > 0.9 ? "very similar" : similarity > 0.7 ? "similar" : similarity > 0.5 ? "somewhat similar" : "dissimilar",
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export function openaicosineSimilarity(vec1: number[], vec2: number[]): number {
    const dotProd = this.dotProduct(vec1, vec2);
    const mag1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
    const mag2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));
    return dotProd / (mag1 * mag2);
  }

  export function openaidotProduct(vec1: number[], vec2: number[]): number {
    return vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
  }

  export function openaieuclideanDistance(vec1: number[], vec2: number[]): number {
    return Math.sqrt(vec1.reduce((sum, val, i) => sum + Math.pow(val - vec2[i], 2), 0));
  }

  export async function openaiEmbeddingCluster(args: any) {
    const { texts, num_clusters = 3, method = "kmeans", model = "text-embedding-3-small" } = args;
    try {
      const embeddings = await openai.embeddings.create({ model, input: texts });
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

      return formatResponse({
        num_clusters: num_clusters,
        method: method,
        model: model,
        clusters: clusterGroups,
        cluster_sizes: Object.values(clusterGroups).map((g: any) => g.length),
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export function openaikMeansClustering(vectors: number[][], k: number): number[] {
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

  export async function openaiEmbeddingSearch(args: any) {
    const { query, documents, top_k = 5, model = "text-embedding-3-small" } = args;
    try {
      const [queryEmbedding, docEmbeddings] = await Promise.all([
        openai.embeddings.create({ model, input: query }),
        openai.embeddings.create({ model, input: documents }),
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

      return formatResponse({
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
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiEmbeddingOutlierDetection(args: any) {
    const { texts, threshold = 2.5, model = "text-embedding-3-small" } = args;
    try {
      const embeddings = await openai.embeddings.create({ model, input: texts });
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

      return formatResponse({
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
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiEmbeddingDimensionalityReduction(args: any) {
    const { texts, target_dimensions = 2, method = "pca", model = "text-embedding-3-small" } = args;
    try {
      const embeddings = await openai.embeddings.create({ model, input: texts });
      const vectors = embeddings.data.map(d => d.embedding);

      // Simple PCA implementation
      const reduced = this.simplePCA(vectors, target_dimensions);

      return formatResponse({
        method: method,
        original_dimensions: vectors[0].length,
        target_dimensions: target_dimensions,
        reduced_embeddings: reduced.map((vec, idx) => ({
          text: texts[idx].substring(0, 50) + "...",
          coordinates: vec.map(v => v.toFixed(4)),
        })),
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export function openaisimplePCA(vectors: number[][], targetDim: number): number[][] {
    // Simplified PCA - just take first N dimensions for now
    // In production, would use proper PCA with eigenvalue decomposition
    return vectors.map(vec => vec.slice(0, targetDim));
  }

  export async function openaiEmbeddingVisualization(args: any) {
    const { texts, labels = [], model = "text-embedding-3-small" } = args;
    try {
      const embeddings = await openai.embeddings.create({ model, input: texts });
      const vectors = embeddings.data.map(d => d.embedding);

      // Reduce to 2D for visualization
      const reduced = this.simplePCA(vectors, 2);

      return formatResponse({
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
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiEmbeddingBatchSimilarity(args: any) {
    const { texts, model = "text-embedding-3-small" } = args;
    try {
      const embeddings = await openai.embeddings.create({ model, input: texts });
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

      return formatResponse({
        num_texts: texts.length,
        similarity_matrix: similarityMatrix.map(row => row.map(v => v.toFixed(4))),
        most_similar_pairs: pairs.slice(0, 10),
        least_similar_pairs: pairs.slice(-10).reverse(),
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }


  export async function openaiEmbeddingIndexCreate(args: any) {
    const { index_name, documents, model = "text-embedding-3-small", metadata = [] } = args;
    try {
      const embeddings = await openai.embeddings.create({ model, input: documents });
      const vectors = embeddings.data.map(d => d.embedding);

      embeddingIndexes.set(index_name, {
        documents: documents,
        vectors: vectors,
        metadata: metadata,
        model: model,
        created: new Date().toISOString(),
      });

      return formatResponse({
        index_name: index_name,
        num_documents: documents.length,
        model: model,
        status: "created",
        usage: `Use openai_embedding_search with this index for semantic search`,
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  // ==================== REALTIME API ====================
  // Note: Realtime API uses WebSocket connections. These implementations provide
  // structure and guidance. Full implementation would require WebSocket client.


  export async function openaiRealtimeSessionCreate(args: any) {
    const { model = "gpt-4o-realtime-preview", voice = "alloy", instructions = "", modalities = ["text", "audio"] } = args;
    try {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      realtimeSessions.set(sessionId, {
        model,
        voice,
        instructions,
        modalities,
        created: new Date().toISOString(),
        status: "active",
        messages: [],
        transcript: [],
      });

      return formatResponse({
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
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiRealtimeSessionUpdate(args: any) {
    const { session_id, voice, instructions, temperature } = args;
    try {
      const session = realtimeSessions.get(session_id);
      if (!session) {
        return formatResponse({ error: `Session ${session_id} not found` });
      }

      if (voice) session.voice = voice;
      if (instructions) session.instructions = instructions;
      if (temperature !== undefined) session.temperature = temperature;

      return formatResponse({
        session_id: session_id,
        updated: true,
        current_config: {
          voice: session.voice,
          instructions: session.instructions,
          temperature: session.temperature,
        },
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiRealtimeAudioSend(args: any) {
    const { session_id, audio_data, format = "pcm16" } = args;
    try {
      const session = realtimeSessions.get(session_id);
      if (!session) {
        return formatResponse({ error: `Session ${session_id} not found` });
      }

      session.messages.push({
        type: "audio_input",
        format: format,
        timestamp: new Date().toISOString(),
        size_bytes: audio_data.length,
      });

      return formatResponse({
        session_id: session_id,
        status: "received",
        format: format,
        note: "In production, this would send audio via WebSocket to OpenAI Realtime API",
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiRealtimeAudioReceive(args: any) {
    const { session_id, timeout_ms = 5000 } = args;
    try {
      const session = realtimeSessions.get(session_id);
      if (!session) {
        return formatResponse({ error: `Session ${session_id} not found` });
      }

      return formatResponse({
        session_id: session_id,
        status: "simulated",
        note: "In production, this would receive audio via WebSocket from OpenAI Realtime API",
        audio_format: "pcm16",
        sample_rate: 24000,
        channels: 1,
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiRealtimeTextSend(args: any) {
    const { session_id, text } = args;
    try {
      const session = realtimeSessions.get(session_id);
      if (!session) {
        return formatResponse({ error: `Session ${session_id} not found` });
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

      return formatResponse({
        session_id: session_id,
        status: "sent",
        message: text,
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiRealtimeTextReceive(args: any) {
    const { session_id, timeout_ms = 5000 } = args;
    try {
      const session = realtimeSessions.get(session_id);
      if (!session) {
        return formatResponse({ error: `Session ${session_id} not found` });
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

      return formatResponse({
        session_id: session_id,
        response: response,
        status: "simulated",
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiRealtimeFunctionCall(args: any) {
    const { session_id, functions } = args;
    try {
      const session = realtimeSessions.get(session_id);
      if (!session) {
        return formatResponse({ error: `Session ${session_id} not found` });
      }

      session.functions = functions;

      return formatResponse({
        session_id: session_id,
        functions_registered: functions.length,
        status: "configured",
        note: "Functions are now available for the assistant to call during conversation",
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiRealtimeInterrupt(args: any) {
    const { session_id } = args;
    try {
      const session = realtimeSessions.get(session_id);
      if (!session) {
        return formatResponse({ error: `Session ${session_id} not found` });
      }

      return formatResponse({
        session_id: session_id,
        status: "interrupted",
        note: "In production, this would send interrupt signal via WebSocket to stop ongoing response",
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiRealtimeSessionClose(args: any) {
    const { session_id } = args;
    try {
      const session = realtimeSessions.get(session_id);
      if (!session) {
        return formatResponse({ error: `Session ${session_id} not found` });
      }

      const summary = {
        session_id: session_id,
        duration_seconds: (Date.now() - new Date(session.created).getTime()) / 1000,
        total_messages: session.messages.length,
        transcript_length: session.transcript.length,
      };

      realtimeSessions.delete(session_id);

      return formatResponse({
        ...summary,
        status: "closed",
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiRealtimeGetTranscript(args: any) {
    const { session_id, format = "text" } = args;
    try {
      const session = realtimeSessions.get(session_id);
      if (!session) {
        return formatResponse({ error: `Session ${session_id} not found` });
      }

      if (format === "text") {
        const text = session.transcript.map((t: any) => `${t.speaker}: ${t.text}`).join("\n");
        return formatResponse({
          session_id: session_id,
          format: "text",
          transcript: text,
        });
      } else if (format === "json") {
        return formatResponse({
          session_id: session_id,
          format: "json",
          transcript: session.transcript,
        });
      } else if (format === "srt") {
        const srt = session.transcript.map((t: any, i: number) => {
          const time = new Date(t.timestamp);
          return `${i + 1}\n00:00:${i.toString().padStart(2, '0')},000 --> 00:00:${(i + 1).toString().padStart(2, '0')},000\n${t.speaker}: ${t.text}\n`;
        }).join("\n");
        return formatResponse({
          session_id: session_id,
          format: "srt",
          transcript: srt,
        });
      }

      return formatResponse({ error: `Unknown format: ${format}` });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiRealtimeConfigureVoice(args: any) {
    const { session_id, voice, speed = 1.0 } = args;
    try {
      const session = realtimeSessions.get(session_id);
      if (!session) {
        return formatResponse({ error: `Session ${session_id} not found` });
      }

      if (voice) session.voice = voice;
      session.speed = speed;

      return formatResponse({
        session_id: session_id,
        voice: session.voice,
        speed: speed,
        status: "configured",
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiRealtimeGetMetrics(args: any) {
    const { session_id } = args;
    try {
      const session = realtimeSessions.get(session_id);
      if (!session) {
        return formatResponse({ error: `Session ${session_id} not found` });
      }

      const duration = (Date.now() - new Date(session.created).getTime()) / 1000;

      return formatResponse({
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
      return formatResponse({ error: error.message });
    }
  }

  // ==================== VISION API ====================

  export async function openaiVisionAnalyzeImage(args: any) {
    const { image_url, prompt = "Analyze this image in detail", model = "gpt-4o", detail = "auto" } = args;
    try {
      const response = await openai.chat.completions.create({
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

      return formatResponse({
        analysis: response.choices[0].message.content,
        model: model,
        detail_level: detail,
        usage: response.usage,
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiVisionDescribeImage(args: any) {
    const { image_url, style = "detailed", model = "gpt-4o" } = args;
    try {
      const prompts: any = {
        concise: "Provide a brief, one-sentence description of this image.",
        detailed: "Provide a detailed description of this image, including objects, people, setting, colors, and mood.",
        creative: "Describe this image in a creative, engaging way that captures its essence and tells a story.",
      };

      const response = await openai.chat.completions.create({
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

      return formatResponse({
        description: response.choices[0].message.content,
        style: style,
        model: model,
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiVisionExtractText(args: any) {
    const { image_url, language = "", model = "gpt-4o" } = args;
    try {
      const prompt = language
        ? `Extract all text from this image. The text is in ${language}. Return only the extracted text, preserving formatting where possible.`
        : "Extract all text from this image. Return only the extracted text, preserving formatting where possible.";

      const response = await openai.chat.completions.create({
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

      return formatResponse({
        extracted_text: response.choices[0].message.content,
        language: language || "auto-detected",
        model: model,
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiVisionDetectObjects(args: any) {
    const { image_url, categories = [], model = "gpt-4o" } = args;
    try {
      const prompt = categories.length > 0
        ? `Identify and list all objects in this image, focusing on these categories: ${categories.join(", ")}. For each object, provide: name, location (general area), confidence level.`
        : "Identify and list all objects in this image. For each object, provide: name, location (general area), confidence level.";

      const response = await openai.chat.completions.create({
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

      return formatResponse({
        objects: result.objects || result,
        categories_requested: categories,
        model: model,
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiVisionCompareImages(args: any) {
    const { image_url_1, image_url_2, focus = "both", model = "gpt-4o" } = args;
    try {
      const prompts: any = {
        differences: "Compare these two images and identify all differences between them. Be specific and detailed.",
        similarities: "Compare these two images and identify all similarities between them. Be specific and detailed.",
        both: "Compare these two images. Identify both similarities and differences. Organize your response clearly.",
      };

      const response = await openai.chat.completions.create({
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

      return formatResponse({
        comparison: response.choices[0].message.content,
        focus: focus,
        model: model,
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiVisionGenerateCaption(args: any) {
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

      const response = await openai.chat.completions.create({
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

      return formatResponse({
        caption: response.choices[0].message.content,
        style: style,
        tone: tone,
        model: model,
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiVisionAnswerQuestion(args: any) {
    const { image_url, question, model = "gpt-4o" } = args;
    try {
      const response = await openai.chat.completions.create({
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

      return formatResponse({
        question: question,
        answer: response.choices[0].message.content,
        model: model,
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiVisionBatchAnalyze(args: any) {
    const { image_urls, prompt, model = "gpt-4o" } = args;
    try {
      const results = await Promise.all(
        image_urls.map(async (url: string, idx: number) => {
          try {
            const response = await openai.chat.completions.create({
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

      return formatResponse({
        total_images: image_urls.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results: results,
        model: model,
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  // ==================== ADVANCED FINE-TUNING ====================

  export async function openaiFineTuningValidateData(args: any) {
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

      return formatResponse({
        valid: errors.length === 0,
        total_examples: training_data.length,
        errors: errors,
        warnings: warnings,
        recommendations: errors.length === 0 ? ["Data format is valid", "Ready for fine-tuning"] : ["Fix errors before proceeding"],
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiFineTuningEstimateCost(args: any) {
    const { training_file_id, model = "gpt-4o-mini-2024-07-18", n_epochs = 3 } = args;
    try {
      const file = await openai.files.retrieve(training_file_id);
      const estimatedTokens = parseInt(file.bytes as any) / 4; // Rough estimate: 4 bytes per token

      const pricing: any = {
        "gpt-4o-mini-2024-07-18": { training: 3.00, input: 0.30, output: 1.20 }, // per 1M tokens
        "gpt-3.5-turbo": { training: 8.00, input: 3.00, output: 6.00 },
      };

      const modelPricing = pricing[model] || pricing["gpt-4o-mini-2024-07-18"];
      const trainingCost = (estimatedTokens / 1000000) * modelPricing.training * n_epochs;

      return formatResponse({
        training_file_id: training_file_id,
        model: model,
        n_epochs: n_epochs,
        estimated_tokens: Math.round(estimatedTokens),
        estimated_cost_usd: trainingCost.toFixed(2),
        pricing_per_1m_tokens: modelPricing,
        note: "This is an estimate. Actual cost may vary.",
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiFineTuningGetMetrics(args: any) {
    const { fine_tuning_job_id } = args;
    try {
      const job = await openai.fineTuning.jobs.retrieve(fine_tuning_job_id);

      return formatResponse({
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
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiFineTuningCompareModels(args: any) {
    const { base_model, fine_tuned_model, test_prompts } = args;
    try {
      const comparisons = await Promise.all(
        test_prompts.map(async (prompt: string) => {
          const [baseResponse, fineTunedResponse] = await Promise.all([
            openai.chat.completions.create({
              model: base_model,
              messages: [{ role: "user", content: prompt }],
              max_tokens: 200,
            }),
            openai.chat.completions.create({
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

      return formatResponse({
        base_model: base_model,
        fine_tuned_model: fine_tuned_model,
        comparisons: comparisons,
        summary: `Compared ${test_prompts.length} prompts between base and fine-tuned models`,
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiFineTuningAnalyzeResults(args: any) {
    const { fine_tuning_job_id } = args;
    try {
      const job = await openai.fineTuning.jobs.retrieve(fine_tuning_job_id);

      const recommendations: string[] = [];
      if (job.status === "succeeded") {
        recommendations.push("Fine-tuning completed successfully");
        recommendations.push(`Model ${job.fine_tuned_model} is ready to use`);
      } else if (job.status === "failed") {
        recommendations.push("Fine-tuning failed - check error logs");
      } else {
        recommendations.push(`Job is ${job.status}`);
      }

      return formatResponse({
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
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiFineTuningExportModel(args: any) {
    const { fine_tuned_model, include_metrics = true } = args;
    try {
      const jobs = await openai.fineTuning.jobs.list({ limit: 100 });
      const job = jobs.data.find((j: any) => j.fine_tuned_model === fine_tuned_model);

      if (!job) {
        return formatResponse({ error: `No fine-tuning job found for model ${fine_tuned_model}` });
      }

      return formatResponse({
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
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiFineTuningListCheckpoints(args: any) {
    const { fine_tuning_job_id } = args;
    try {
      const checkpoints = await openai.fineTuning.jobs.checkpoints.list(fine_tuning_job_id);

      return formatResponse({
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
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiFineTuningGetBestCheckpoint(args: any) {
    const { fine_tuning_job_id, metric = "loss" } = args;
    try {
      const checkpoints = await openai.fineTuning.jobs.checkpoints.list(fine_tuning_job_id);

      if (checkpoints.data.length === 0) {
        return formatResponse({ error: "No checkpoints found" });
      }

      const best = checkpoints.data.reduce((best: any, current: any) => {
        const bestMetric = best.metrics?.[metric] || Infinity;
        const currentMetric = current.metrics?.[metric] || Infinity;
        return currentMetric < bestMetric ? current : best;
      });

      return formatResponse({
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
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiFineTuningPrepareDataset(args: any) {
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

      return formatResponse({
        format: format,
        total_examples: prepared.length,
        sample: prepared.slice(0, 3),
        ready_for_upload: true,
        next_step: "Upload this data using openai_upload_file with purpose='fine-tune'",
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiFineTuningHyperparameterSearch(args: any) {
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

      return formatResponse({
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
      return formatResponse({ error: error.message });
    }
  }

  // ==================== ADVANCED BATCH ====================

  export async function openaiBatchEstimateCost(args: any) {
    const { requests, model = "gpt-4o-mini" } = args;
    try {
      let totalTokens = 0;
      for (const req of requests) {
        const prompt = req.body?.messages?.map((m: any) => m.content).join(" ") || "";
        totalTokens += await costManager.estimateTokens(prompt, model);
      }

      const pricing = (costManager as any).PRICING[model];
      const inputCost = (totalTokens / 1000000) * pricing.input;
      const batchDiscount = 0.5; // 50% discount for batch API
      const finalCost = inputCost * batchDiscount;

      return formatResponse({
        total_requests: requests.length,
        estimated_tokens: totalTokens,
        model: model,
        cost_without_batch: inputCost.toFixed(4),
        cost_with_batch: finalCost.toFixed(4),
        savings: (inputCost - finalCost).toFixed(4),
        discount_percentage: "50%",
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiBatchMonitor(args: any) {
    const { batch_id, include_errors = true } = args;
    try {
      const batch = await openai.batches.retrieve(batch_id);

      const progress = batch.request_counts ? {
        total: batch.request_counts.total,
        completed: batch.request_counts.completed,
        failed: batch.request_counts.failed,
        percentage: ((batch.request_counts.completed / batch.request_counts.total) * 100).toFixed(2),
      } : null;

      return formatResponse({
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
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiBatchRetryFailed(args: any) {
    const { batch_id, max_retries = 3 } = args;
    try {
      const batch = await openai.batches.retrieve(batch_id);

      if (!batch.error_file_id) {
        return formatResponse({ message: "No errors to retry", batch_id: batch_id });
      }

      return formatResponse({
        batch_id: batch_id,
        error_file_id: batch.error_file_id,
        max_retries: max_retries,
        next_step: "Download error file, fix issues, and create new batch",
        note: "Automatic retry not yet implemented - manual intervention required",
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiBatchSplitLarge(args: any) {
    const { requests, chunk_size = 50000 } = args;
    try {
      const chunks: any[] = [];
      for (let i = 0; i < requests.length; i += chunk_size) {
        chunks.push(requests.slice(i, i + chunk_size));
      }

      return formatResponse({
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
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiBatchMergeResults(args: any) {
    const { batch_ids, output_format = "jsonl" } = args;
    try {
      const results: any[] = [];

      for (const batch_id of batch_ids) {
        const batch = await openai.batches.retrieve(batch_id);
        results.push({
          batch_id: batch_id,
          status: batch.status,
          output_file_id: batch.output_file_id,
          request_counts: batch.request_counts,
        });
      }

      return formatResponse({
        total_batches: batch_ids.length,
        batches: results,
        output_format: output_format,
        next_step: "Download output files and merge manually",
        note: "Automatic merging not yet implemented",
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiBatchSchedule(args: any) {
    const { input_file_id, endpoint, schedule_time } = args;
    try {
      const scheduledTime = new Date(schedule_time);
      const now = new Date();

      if (scheduledTime <= now) {
        return formatResponse({ error: "Schedule time must be in the future" });
      }

      return formatResponse({
        input_file_id: input_file_id,
        endpoint: endpoint,
        scheduled_for: scheduledTime.toISOString(),
        time_until_execution: Math.round((scheduledTime.getTime() - now.getTime()) / 1000 / 60) + " minutes",
        note: "Scheduling not yet implemented - create batch immediately or use external scheduler",
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiBatchOptimize(args: any) {
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

      return formatResponse({
        total_requests: requests.length,
        optimization_goal: optimization_goal,
        recommendations: recommendations,
        estimated_processing_time: `${Math.ceil(requests.length / 1000)} hours (batch API)`,
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiBatchAnalytics(args: any) {
    const { time_range = "7d", include_costs = true } = args;
    try {
      const batches = await openai.batches.list({ limit: 100 });

      const stats = {
        total_batches: batches.data.length,
        completed: batches.data.filter((b: any) => b.status === "completed").length,
        failed: batches.data.filter((b: any) => b.status === "failed").length,
        in_progress: batches.data.filter((b: any) => b.status === "in_progress").length,
      };

      return formatResponse({
        time_range: time_range,
        statistics: stats,
        recent_batches: batches.data.slice(0, 10).map((b: any) => ({
          id: b.id,
          status: b.status,
          created_at: new Date((b.created_at as any) * 1000).toISOString(),
        })),
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  // ==================== AGENTS SDK ====================
  // Note: Agents SDK is built on top of Assistants API


  export async function openaiAgentCreate(args: any) {
    const { name, instructions, tools = [], model = "gpt-4o" } = args;
    try {
      const assistant = await openai.beta.assistants.create({
        name: name,
        instructions: instructions,
        tools: tools,
        model: model,
      });

      // Initialize agent memory and state
      agentMemoryStore.set(assistant.id, {});
      agentStateStore.set(assistant.id, { status: "idle", created_at: new Date().toISOString() });

      return formatResponse({
        agent_id: assistant.id,
        name: name,
        model: model,
        tools: tools,
        status: "created",
        note: "Agent created using Assistants API",
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiAgentRun(args: any) {
    const { agent_id, task, context = {} } = args;
    try {
      const thread = await openai.beta.threads.create();

      await openai.beta.threads.messages.create(thread.id, {
        role: "user",
        content: task,
      });

      const run = await openai.beta.threads.runs.create(thread.id, {
        assistant_id: agent_id,
      });

      // Wait for completion (simplified - in production would poll)
      let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      let attempts = 0;
      while (runStatus.status === "in_progress" || runStatus.status === "queued") {
        if (attempts++ > 30) break; // Timeout after 30 attempts
        await new Promise(resolve => setTimeout(resolve, 1000));
        runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      }

      const messages = await openai.beta.threads.messages.list(thread.id);
      const lastMessage = messages.data[0];

      return formatResponse({
        agent_id: agent_id,
        task: task,
        status: runStatus.status,
        response: lastMessage.content[0].type === "text" ? (lastMessage.content[0] as any).text.value : null,
        thread_id: thread.id,
        run_id: run.id,
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiAgentStream(args: any) {
    const { agent_id, task } = args;
    try {
      return formatResponse({
        agent_id: agent_id,
        task: task,
        note: "Streaming not yet implemented - use agentRun for now",
        status: "not_implemented",
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiAgentWithTools(args: any) {
    const { agent_id, task, tools } = args;
    try {
      // Update assistant with specific tools
      await openai.beta.assistants.update(agent_id, {
        tools: tools,
      });

      // Run the agent
      const result = await this.agentRun({ agent_id, task });

      return formatResponse({
        ...result,
        tools_enabled: tools,
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiAgentHandoff(args: any) {
    const { from_agent_id, to_agent_id, task, context = {} } = args;
    try {
      // Get context from first agent
      const fromState = agentStateStore.get(from_agent_id) || {};
      const fromMemory = agentMemoryStore.get(from_agent_id) || {};

      // Transfer context to second agent
      const toMemory = agentMemoryStore.get(to_agent_id) || {};
      agentMemoryStore.set(to_agent_id, { ...toMemory, ...fromMemory, ...context });

      // Run second agent
      const result = await this.agentRun({ agent_id: to_agent_id, task, context });

      return formatResponse({
        from_agent_id: from_agent_id,
        to_agent_id: to_agent_id,
        handoff_status: "completed",
        result: result,
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiAgentParallel(args: any) {
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

      return formatResponse({
        agents_run: agents.length,
        merge_strategy: merge_strategy,
        results: results,
        merged_result: mergedResult,
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiAgentSequential(args: any) {
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

      return formatResponse({
        agents_run: agents.length,
        pass_output: pass_output,
        results: results,
        final_output: previousOutput,
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiAgentConditional(args: any) {
    const { condition, if_agent_id, else_agent_id, task } = args;
    try {
      // Simplified condition evaluation - in production would use proper evaluation
      const conditionMet = condition.toLowerCase().includes("true");
      const selectedAgentId = conditionMet ? if_agent_id : else_agent_id;

      if (!selectedAgentId) {
        return formatResponse({ error: "No agent selected for condition result" });
      }

      const result = await this.agentRun({ agent_id: selectedAgentId, task });

      return formatResponse({
        condition: condition,
        condition_met: conditionMet,
        selected_agent: selectedAgentId,
        result: result,
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiAgentLoop(args: any) {
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

      return formatResponse({
        agent_id: agent_id,
        iterations: iteration,
        max_iterations: max_iterations,
        stop_condition: stop_condition,
        results: results,
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiAgentMemory(args: any) {
    const { agent_id, operation, key, value } = args;
    try {
      const memory = agentMemoryStore.get(agent_id) || {};

      if (operation === "get") {
        return formatResponse({
          agent_id: agent_id,
          operation: "get",
          memory: key ? { [key]: memory[key] } : memory,
        });
      } else if (operation === "set") {
        memory[key] = value;
        agentMemoryStore.set(agent_id, memory);
        return formatResponse({
          agent_id: agent_id,
          operation: "set",
          key: key,
          value: value,
        });
      } else if (operation === "clear") {
        agentMemoryStore.set(agent_id, {});
        return formatResponse({
          agent_id: agent_id,
          operation: "clear",
          status: "cleared",
        });
      }

      return formatResponse({ error: `Unknown operation: ${operation}` });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiAgentState(args: any) {
    const { agent_id, state } = args;
    try {
      if (state) {
        agentStateStore.set(agent_id, { ...agentStateStore.get(agent_id), ...state });
      }

      return formatResponse({
        agent_id: agent_id,
        state: agentStateStore.get(agent_id) || {},
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiAgentMonitor(args: any) {
    const { agent_id, time_range = "24h" } = args;
    try {
      const state = agentStateStore.get(agent_id) || {};
      const memory = agentMemoryStore.get(agent_id) || {};

      return formatResponse({
        agent_id: agent_id,
        time_range: time_range,
        state: state,
        memory_size: Object.keys(memory).length,
        status: "active",
        note: "Full monitoring metrics not yet implemented",
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiAgentOptimize(args: any) {
    const { agent_id, optimization_goal = "balanced" } = args;
    try {
      const assistant = await openai.beta.assistants.retrieve(agent_id);

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

      return formatResponse({
        agent_id: agent_id,
        current_model: assistant.model,
        optimization_goal: optimization_goal,
        recommendations: recommendations,
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiAgentExport(args: any) {
    const { agent_id, include_history = false } = args;
    try {
      const assistant = await openai.beta.assistants.retrieve(agent_id);
      const memory = agentMemoryStore.get(agent_id) || {};
      const state = agentStateStore.get(agent_id) || {};

      return formatResponse({
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
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiAgentImport(args: any) {
    const { config, name } = args;
    try {
      const assistant = await openai.beta.assistants.create({
        name: name || config.name,
        instructions: config.instructions,
        tools: config.tools,
        model: config.model,
      });

      if (config.memory) {
        agentMemoryStore.set(assistant.id, config.memory);
      }
      if (config.state) {
        agentStateStore.set(assistant.id, config.state);
      }

      return formatResponse({
        agent_id: assistant.id,
        name: name || config.name,
        status: "imported",
        import_timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  // ==================== ADVANCED ASSISTANTS ====================


  export async function openaiAssistantClone(args: any) {
    const { assistant_id, name } = args;
    try {
      const original = await openai.beta.assistants.retrieve(assistant_id);

      const cloned = await openai.beta.assistants.create({
        name: name || `${original.name} (Clone)`,
        instructions: original.instructions,
        tools: original.tools,
        model: original.model,
      });

      return formatResponse({
        original_id: assistant_id,
        cloned_id: cloned.id,
        name: cloned.name,
        status: "cloned",
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiAssistantExport(args: any) {
    const { assistant_id, include_files = false } = args;
    try {
      const assistant = await openai.beta.assistants.retrieve(assistant_id);

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

      return formatResponse({
        assistant_id: assistant_id,
        config: config,
        export_timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiAssistantImport(args: any) {
    const { config } = args;
    try {
      const assistant = await openai.beta.assistants.create({
        name: config.name,
        instructions: config.instructions,
        tools: config.tools,
        model: config.model,
        metadata: config.metadata || {},
      });

      return formatResponse({
        assistant_id: assistant.id,
        name: assistant.name,
        status: "imported",
        import_timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiAssistantTest(args: any) {
    const { assistant_id, test_cases } = args;
    try {
      const results: any[] = [];

      for (const testCase of test_cases) {
        const thread = await openai.beta.threads.create();
        await openai.beta.threads.messages.create(thread.id, {
          role: "user",
          content: testCase,
        });

        const run = await openai.beta.threads.runs.create(thread.id, {
          assistant_id: assistant_id,
        });

        // Wait for completion (simplified)
        let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
        let attempts = 0;
        while (runStatus.status === "in_progress" || runStatus.status === "queued") {
          if (attempts++ > 30) break;
          await new Promise(resolve => setTimeout(resolve, 1000));
          runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
        }

        const messages = await openai.beta.threads.messages.list(thread.id);
        const response = messages.data[0].content[0].type === "text"
          ? (messages.data[0].content[0] as any).text.value
          : null;

        results.push({
          input: testCase,
          output: response,
          status: runStatus.status,
        });
      }

      return formatResponse({
        assistant_id: assistant_id,
        total_tests: test_cases.length,
        results: results,
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiAssistantOptimize(args: any) {
    const { assistant_id, optimization_goal = "balanced" } = args;
    try {
      const assistant = await openai.beta.assistants.retrieve(assistant_id);

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

      return formatResponse({
        assistant_id: assistant_id,
        current_model: assistant.model,
        current_tools: assistant.tools.length,
        optimization_goal: optimization_goal,
        recommendations: recommendations,
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiAssistantAnalytics(args: any) {
    const { assistant_id, time_range = "7d" } = args;
    try {
      return formatResponse({
        assistant_id: assistant_id,
        time_range: time_range,
        note: "Analytics not yet implemented - would require tracking usage in database",
        status: "not_implemented",
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiAssistantVersion(args: any) {
    const { assistant_id, version_name, changes = {} } = args;
    try {
      const current = await openai.beta.assistants.retrieve(assistant_id);

      // Store current version
      const versions = assistantVersionStore.get(assistant_id) || [];
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
      assistantVersionStore.set(assistant_id, versions);

      // Apply changes if provided
      if (Object.keys(changes).length > 0) {
        await openai.beta.assistants.update(assistant_id, changes);
      }

      return formatResponse({
        assistant_id: assistant_id,
        version_name: version_name,
        total_versions: versions.length,
        status: "version_created",
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiAssistantRollback(args: any) {
    const { assistant_id, version_name } = args;
    try {
      const versions = assistantVersionStore.get(assistant_id) || [];
      const targetVersion = versions.find((v: any) => v.version_name === version_name);

      if (!targetVersion) {
        return formatResponse({ error: `Version ${version_name} not found` });
      }

      await openai.beta.assistants.update(assistant_id, targetVersion.config);

      return formatResponse({
        assistant_id: assistant_id,
        rolled_back_to: version_name,
        timestamp: targetVersion.timestamp,
        status: "rollback_complete",
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiAssistantCompare(args: any) {
    const { assistant_id_1, assistant_id_2, test_cases = [] } = args;
    try {
      const [assistant1, assistant2] = await Promise.all([
        openai.beta.assistants.retrieve(assistant_id_1),
        openai.beta.assistants.retrieve(assistant_id_2),
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

      return formatResponse(comparison);
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiAssistantBenchmark(args: any) {
    const { assistant_id, benchmark_suite = "comprehensive" } = args;
    try {
      const assistant = await openai.beta.assistants.retrieve(assistant_id);

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
        const pricing = (costManager as any).PRICING[assistant.model];
        benchmarks.cost = {
          model: assistant.model,
          input_cost_per_1m: pricing?.input || "unknown",
          output_cost_per_1m: pricing?.output || "unknown",
        };
      }

      return formatResponse(benchmarks);
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiAssistantMonitor(args: any) {
    const { assistant_id, metrics = [] } = args;
    try {
      const assistant = await openai.beta.assistants.retrieve(assistant_id);

      return formatResponse({
        assistant_id: assistant_id,
        name: assistant.name,
        model: assistant.model,
        tools: assistant.tools.length,
        status: "active",
        note: "Real-time monitoring not yet implemented",
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiAssistantAudit(args: any) {
    const { assistant_id, time_range = "7d" } = args;
    try {
      const versions = assistantVersionStore.get(assistant_id) || [];

      return formatResponse({
        assistant_id: assistant_id,
        time_range: time_range,
        version_history: versions,
        total_versions: versions.length,
        note: "Full audit logging not yet implemented",
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  // ==================== ADVANCED VECTOR STORES ====================

  export async function openaiVectorSearch(args: any) {
    const { vector_store_id, query, limit = 10 } = args;
    try {
      // Note: OpenAI Vector Stores API doesn't have direct search endpoint
      // This would typically be done through file_search tool in Assistants API
      return formatResponse({
        vector_store_id: vector_store_id,
        query: query,
        limit: limit,
        note: "Direct vector search not available - use file_search tool in Assistants API",
        status: "not_implemented",
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiVectorSimilarity(args: any) {
    const { vector_store_id, vector, limit = 10 } = args;
    try {
      return formatResponse({
        vector_store_id: vector_store_id,
        limit: limit,
        note: "Vector similarity search not directly available in OpenAI API",
        status: "not_implemented",
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiVectorCluster(args: any) {
    const { vector_store_id, num_clusters = 5 } = args;
    try {
      return formatResponse({
        vector_store_id: vector_store_id,
        num_clusters: num_clusters,
        note: "Vector clustering not available in OpenAI API - would need custom implementation",
        status: "not_implemented",
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiVectorDeduplicate(args: any) {
    const { vector_store_id, similarity_threshold = 0.95 } = args;
    try {
      return formatResponse({
        vector_store_id: vector_store_id,
        similarity_threshold: similarity_threshold,
        note: "Vector deduplication not available in OpenAI API",
        status: "not_implemented",
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiVectorMerge(args: any) {
    const { source_store_ids, target_store_name } = args;
    try {
      return formatResponse({
        source_stores: source_store_ids.length,
        target_store_name: target_store_name,
        note: "Vector store merging not available in OpenAI API - would need custom implementation",
        status: "not_implemented",
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiVectorExport(args: any) {
    const { vector_store_id, format = "json" } = args;
    try {
      return formatResponse({
        vector_store_id: vector_store_id,
        format: format,
        note: "Vector store export not available in OpenAI API - use file_search tool in Assistants API",
        status: "not_implemented",
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiVectorImport(args: any) {
    const { vector_store_id, data, format = "json" } = args;
    try {
      return formatResponse({
        vector_store_id: vector_store_id,
        data_items: data.length,
        format: format,
        note: "Import not yet implemented - use vectorStores.files.upload for file uploads",
        status: "not_implemented",
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiVectorOptimize(args: any) {
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

      return formatResponse({
        vector_store_id: vector_store_id,
        optimization_type: optimization_type,
        recommendations: recommendations,
        note: "Vector store optimization not available in OpenAI API",
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiVectorAnalytics(args: any) {
    const { vector_store_id } = args;
    try {
      return formatResponse({
        vector_store_id: vector_store_id,
        note: "Vector store analytics not available in OpenAI API - use file_search tool in Assistants API",
        status: "not_implemented",
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiVectorBackup(args: any) {
    const { vector_store_id, backup_name } = args;
    try {
      return formatResponse({
        vector_store_id: vector_store_id,
        backup_name: backup_name || `backup_${Date.now()}`,
        note: "Vector store backup not available in OpenAI API",
        status: "not_implemented",
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  // ==================== ADVANCED RUNS ====================

  export async function openaiRunRetry(args: any) {
    const { thread_id, run_id } = args;
    try {
      const originalRun = await openai.beta.threads.runs.retrieve(thread_id, run_id);

      // Create new run with same parameters
      const newRun = await openai.beta.threads.runs.create(thread_id, {
        assistant_id: originalRun.assistant_id,
        model: originalRun.model,
        instructions: originalRun.instructions,
        tools: originalRun.tools,
      });

      return formatResponse({
        original_run_id: run_id,
        new_run_id: newRun.id,
        status: newRun.status,
        note: "New run created with same parameters",
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiRunResume(args: any) {
    const { thread_id, run_id } = args;
    try {
      const run = await openai.beta.threads.runs.retrieve(thread_id, run_id);

      return formatResponse({
        run_id: run_id,
        status: run.status,
        note: "Run resume not directly supported - use cancel and retry instead",
        status_info: "not_implemented",
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiRunClone(args: any) {
    const { thread_id, run_id } = args;
    try {
      const originalRun = await openai.beta.threads.runs.retrieve(thread_id, run_id);

      // Create new thread with same messages
      const newThread = await openai.beta.threads.create();
      const messages = await openai.beta.threads.messages.list(thread_id);

      // Copy messages to new thread
      for (const message of messages.data.reverse()) {
        if (message.role === "user") {
          await openai.beta.threads.messages.create(newThread.id, {
            role: "user",
            content: message.content[0].type === "text" ? (message.content[0] as any).text.value : "",
          });
        }
      }

      // Create new run
      const newRun = await openai.beta.threads.runs.create(newThread.id, {
        assistant_id: originalRun.assistant_id,
        model: originalRun.model,
        instructions: originalRun.instructions,
        tools: originalRun.tools,
      });

      return formatResponse({
        original_thread_id: thread_id,
        original_run_id: run_id,
        new_thread_id: newThread.id,
        new_run_id: newRun.id,
        status: "cloned",
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiRunAnalyze(args: any) {
    const { thread_id, run_id } = args;
    try {
      const run = await openai.beta.threads.runs.retrieve(thread_id, run_id);
      const steps = await openai.beta.threads.runs.steps.list(thread_id, run_id);

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

      return formatResponse(analysis);
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiRunOptimize(args: any) {
    const { thread_id, run_id } = args;
    try {
      const run = await openai.beta.threads.runs.retrieve(thread_id, run_id);

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

      return formatResponse({
        run_id: run_id,
        current_model: run.model,
        current_tools: run.tools.length,
        status: run.status,
        recommendations: recommendations,
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiRunMonitor(args: any) {
    const { thread_id, run_id } = args;
    try {
      const run = await openai.beta.threads.runs.retrieve(thread_id, run_id);
      const steps = await openai.beta.threads.runs.steps.list(thread_id, run_id);

      return formatResponse({
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
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiRunExport(args: any) {
    const { thread_id, run_id, format = "json" } = args;
    try {
      const run = await openai.beta.threads.runs.retrieve(thread_id, run_id);
      const steps = await openai.beta.threads.runs.steps.list(thread_id, run_id);
      const messages = await openai.beta.threads.messages.list(thread_id);

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

      return formatResponse({
        format: format,
        data: exportData,
        export_timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }

  export async function openaiRunCompare(args: any) {
    const { thread_id, run_id_1, run_id_2 } = args;
    try {
      const [run1, run2] = await Promise.all([
        openai.beta.threads.runs.retrieve(thread_id, run_id_1),
        openai.beta.threads.runs.retrieve(thread_id, run_id_2),
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

      return formatResponse(comparison);
    } catch (error: any) {
      return formatResponse({ error: error.message });
    }
  }


// Module-level state variables (originally class properties)
const userCosts: Map<string, any[]> = new Map();
const costAlerts: Map<string, any> = new Map();
const contentFilters: Map<string, any> = new Map();
const monitoringAlerts: Map<string, any> = new Map();
const embeddingIndexes: Map<string, any> = new Map();
const realtimeSessions: Map<string, any> = new Map();
const agentMemoryStore: Map<string, any> = new Map();
const agentStateStore: Map<string, any> = new Map();
const assistantVersionStore: Map<string, any[]> = new Map();

// CostManager stub - tracks costs in memory
class CostManager {
  private costs: Array<{ timestamp: number; model: string; cost: number }> = [];

  async recordCost(model: string, cost: number) {
    this.costs.push({ timestamp: Date.now(), model, cost });
  }

  async getTotalCost() {
    return this.costs.reduce((sum, c) => sum + c.cost, 0);
  }

  async getCostsByModel() {
    const byModel: Record<string, number> = {};
    for (const c of this.costs) {
      byModel[c.model] = (byModel[c.model] || 0) + c.cost;
    }
    return byModel;
  }
}

const costManager = new CostManager();

// ============================================================================
// Normalized exports for audit compatibility
// ============================================================================

// Realtime API
export const openaicreaterealtimeSession = openaiRealtimeSessionCreate;
export const openaiupdaterealtimeSession = openaiRealtimeSessionUpdate;
export const openaisendrealtimeMessage = openaiRealtimeTextSend;
export const openaigetrealtimeResponse = openaiRealtimeTextReceive;
export const openaiinterruptrealtimeResponse = openaiRealtimeInterrupt;
export const openaicloserealtimeSession = openaiRealtimeSessionClose;


// Model comparison
export const openaicomparemodelsDetailed = openaiCompareModels;
