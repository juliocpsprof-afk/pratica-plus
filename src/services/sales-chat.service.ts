import { supabase } from "@/lib/supabase/client";
import {
  getSimulationScenarioDetails,
  SimulationScenarioDetails,
} from "@/services/simulation.service";

export type SalesMessageType =
  | "text"
  | "image"
  | "document"
  | "emoji";

export type SalesRichMessage = {
  id: string;
  step_id: string;
  sender: string;
  message_type: SalesMessageType;
  content: string | null;
  media_url: string | null;
  media_name: string | null;
  media_mime_type: string | null;
  media_size_label: string | null;
  caption: string | null;
  emoji: string | null;
  message_order: number;
  delay_ms: number;
  metadata: Record<string, unknown>;
};

type BaseStep =
  SimulationScenarioDetails["steps"][number];

type BaseOption = BaseStep["options"][number];

export type SalesRichOption = BaseOption & {
  response_message_type: SalesMessageType;
  response_media_url: string | null;
  response_media_name: string | null;
  response_media_mime_type: string | null;
  response_media_size_label: string | null;
  response_caption: string | null;
  response_emoji: string | null;
};

export type SalesRichStep = Omit<BaseStep, "options"> & {
  messages: SalesRichMessage[];
  options: SalesRichOption[];
};

export type SalesRichScenarioDetails = Omit<
  SimulationScenarioDetails,
  "steps"
> & {
  sales_lead_temperature: string;
  sales_funnel_stage: string;
  sales_goal: string | null;
  sales_product_name: string | null;
  sales_contact_channel: string;
  sales_avatar_url: string | null;
  steps: SalesRichStep[];
};

function normalizeMessage(row: any): SalesRichMessage {
  return {
    id: row.id,
    step_id: row.step_id,
    sender: row.sender ?? "cliente",
    message_type: row.message_type ?? "text",
    content: row.content ?? null,
    media_url: row.media_url ?? null,
    media_name: row.media_name ?? null,
    media_mime_type: row.media_mime_type ?? null,
    media_size_label: row.media_size_label ?? null,
    caption: row.caption ?? null,
    emoji: row.emoji ?? null,
    message_order: Number(row.message_order ?? 1),
    delay_ms: Number(row.delay_ms ?? 1200),
    metadata:
      row.metadata &&
      typeof row.metadata === "object"
        ? row.metadata
        : {},
  };
}

export async function getSalesRichScenarioDetails(
  scenarioId: string
): Promise<SalesRichScenarioDetails> {
  const base =
    await getSimulationScenarioDetails(scenarioId);

  const { data: metadataData, error: metadataError } =
    await supabase
      .from("scenarios")
      .select(`
        sales_lead_temperature,
        sales_funnel_stage,
        sales_goal,
        sales_product_name,
        sales_contact_channel,
        sales_avatar_url
      `)
      .eq("id", scenarioId)
      .single();

  if (metadataError) {
    throw new Error(metadataError.message);
  }

  const stepIds = base.steps.map((step) => step.id);

  const optionIds = base.steps.flatMap((step) =>
    step.options.map((option) => option.id)
  );

  const messagesByStep = new Map<
    string,
    SalesRichMessage[]
  >();

  if (stepIds.length > 0) {
    const { data: messageData, error: messageError } =
      await supabase
        .from("scenario_step_messages")
        .select(`
          id,
          step_id,
          sender,
          message_type,
          content,
          media_url,
          media_name,
          media_mime_type,
          media_size_label,
          caption,
          emoji,
          message_order,
          delay_ms,
          metadata
        `)
        .in("step_id", stepIds)
        .order("message_order", {
          ascending: true,
        });

    if (messageError) {
      throw new Error(messageError.message);
    }

    for (const row of messageData ?? []) {
      const message = normalizeMessage(row);
      const current =
        messagesByStep.get(message.step_id) ?? [];

      current.push(message);
      messagesByStep.set(message.step_id, current);
    }
  }

  const optionPresentation = new Map<string, any>();

  if (optionIds.length > 0) {
    const { data: optionData, error: optionError } =
      await supabase
        .from("scenario_options")
        .select(`
          id,
          response_message_type,
          response_media_url,
          response_media_name,
          response_media_mime_type,
          response_media_size_label,
          response_caption,
          response_emoji
        `)
        .in("id", optionIds);

    if (optionError) {
      throw new Error(optionError.message);
    }

    for (const option of optionData ?? []) {
      optionPresentation.set(option.id, option);
    }
  }

  const steps: SalesRichStep[] = base.steps.map(
    (step) => {
      const richMessages =
        messagesByStep.get(step.id) ?? [];

      const messages =
        richMessages.length > 0
          ? richMessages
          : [
              {
                id: `fallback-${step.id}`,
                step_id: step.id,
                sender: "cliente",
                message_type: "text" as const,
                content: step.customer_message,
                media_url: null,
                media_name: null,
                media_mime_type: null,
                media_size_label: null,
                caption: null,
                emoji: null,
                message_order: 1,
                delay_ms: 1100,
                metadata: {},
              },
            ];

      const options: SalesRichOption[] =
        step.options.map((option) => {
          const presentation =
            optionPresentation.get(option.id);

          return {
            ...option,
            response_message_type:
              presentation?.response_message_type ??
              "text",
            response_media_url:
              presentation?.response_media_url ?? null,
            response_media_name:
              presentation?.response_media_name ?? null,
            response_media_mime_type:
              presentation?.response_media_mime_type ??
              null,
            response_media_size_label:
              presentation?.response_media_size_label ??
              null,
            response_caption:
              presentation?.response_caption ?? null,
            response_emoji:
              presentation?.response_emoji ?? null,
          };
        });

      return {
        ...step,
        messages,
        options,
      };
    }
  );

  return {
    ...base,
    sales_lead_temperature:
      metadataData.sales_lead_temperature ??
      "morno",
    sales_funnel_stage:
      metadataData.sales_funnel_stage ??
      "descoberta",
    sales_goal: metadataData.sales_goal ?? null,
    sales_product_name:
      metadataData.sales_product_name ?? null,
    sales_contact_channel:
      metadataData.sales_contact_channel ??
      "Messenger",
    sales_avatar_url:
      metadataData.sales_avatar_url ?? null,
    steps,
  };
}
