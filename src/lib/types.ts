export const TOPICS = [
  { id: "world", label: "World" },
  { id: "politics", label: "Politics" },
  { id: "business", label: "Business" },
  { id: "science", label: "Science & health" },
  { id: "climate", label: "Climate" },
  { id: "culture", label: "Culture" },
] as const;

export type TopicId = (typeof TOPICS)[number]["id"];

export type SubscriberStatus = "active" | "paused" | "unsubscribed";

export type Subscriber = {
  id: string;
  email: string;
  status: SubscriberStatus;
  timezone: string;
  sendHour: number;
  topics: TopicId[];
  manageToken: string;
  nextSendAt: string;
  lastSentAt: string | null;
  lastDigestKey: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SubscribeInput = {
  email: string;
  timezone: string;
  sendHour: number;
  topics: TopicId[];
};

export type SubscriberPatch = Partial<
  Pick<Subscriber, "status" | "timezone" | "sendHour" | "topics" | "nextSendAt">
>;

export type Story = {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  topic: TopicId;
  publishedAt: string | null;
};

export type Digest = {
  key: string;
  generatedAt: string;
  stories: Story[];
};

export type CronTickResult = {
  checkedAt: string;
  due: number;
  sent: number;
  skipped: number;
  failed: number;
  errors: string[];
};

export interface Store {
  getByEmail(email: string): Promise<Subscriber | null>;
  getByToken(token: string): Promise<Subscriber | null>;
  listDue(nowIso: string): Promise<Subscriber[]>;
  create(input: SubscribeInput & { nextSendAt: string }): Promise<Subscriber>;
  update(id: string, patch: SubscriberPatch): Promise<Subscriber>;
  /** Returns true if this digest key was newly claimed (safe to send). */
  claimSend(subscriberId: string, digestKey: string): Promise<boolean>;
  releaseSend(subscriberId: string, digestKey: string): Promise<void>;
  markSent(
    subscriberId: string,
    digestKey: string,
    nextSendAt: string,
  ): Promise<void>;
}
