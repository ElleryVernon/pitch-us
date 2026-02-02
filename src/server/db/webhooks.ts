/**
 * Database operations for webhook subscriptions.
 *
 * This module provides functions for managing webhook subscriptions that allow
 * external systems to receive notifications about events in the application.
 * Webhooks are HTTP callbacks that are triggered when specific events occur.
 */

import { prisma } from "../db";
import { v4 as uuidv4 } from "uuid";

/**
 * Webhook subscription record structure stored in the database.
 *
 * Represents a subscription to receive webhook notifications at a specific
 * URL when certain events occur. Multiple subscriptions can exist for the
 * same URL with different event types.
 *
 * @property id - Unique identifier for the webhook subscription.
 * @property url - The callback URL where webhook events should be sent via
 *   HTTP POST requests.
 * @property events - Array of event type strings that this subscription
 *   listens for (e.g., ["presentation.created", "slide.updated"]).
 * @property created_at - ISO 8601 timestamp string of when the subscription
 *   was created.
 */
export type WebhookSubscriptionRecord = {
  id: string;
  url: string;
  events: string[];
  created_at: string;
};

const fromJson = <T>(value: unknown, fallback: T): T => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
};

const toJson = <T>(value: T): string | null => {
  if (value === null || value === undefined) return null;
  return JSON.stringify(value);
};

const rowToSubscription = (
  row: {
    id: string;
    url: string;
    events: string | null;
    created_at: Date;
  } | null,
): WebhookSubscriptionRecord | null => {
  if (!row) return null;
  return {
    id: row.id,
    url: row.url,
    events: fromJson<string[]>(row.events, []),
    created_at: row.created_at.toISOString(),
  };
};

export const createSubscription = async (
  url: string,
  events: string[],
): Promise<WebhookSubscriptionRecord> => {
  const id = uuidv4();
  const now = new Date();

  const created = await prisma.webhookSubscription.create({
    data: {
      id,
      url,
      events: toJson(events),
      created_at: now,
    },
  });

  return rowToSubscription(created)!;
};

export const deleteSubscription = async (url: string): Promise<boolean> => {
  try {
    await prisma.webhookSubscription.deleteMany({
      where: { url },
    });
    return true;
  } catch {
    return false;
  }
};

export const listSubscriptions = async (): Promise<
  WebhookSubscriptionRecord[]
> => {
  const rows = await prisma.webhookSubscription.findMany();
  return rows
    .map(rowToSubscription)
    .filter((r): r is WebhookSubscriptionRecord => r !== null);
};
