/**
 * What: Message key type (from the English dictionary) and the dictionary shape every language
 *   must implement. Missing or extra keys are compile errors.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 */
import type { en } from './en';

export type MessageKey = keyof typeof en;
export type Messages = Record<MessageKey, string>;
