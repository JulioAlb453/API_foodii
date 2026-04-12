export type FcmTopicDataPayload = Record<string, string>;

export interface SendToTopicParams {
  topicSlug: string;
  title: string;
  body: string;
  data?: FcmTopicDataPayload;
}

export interface FcmPushPort {
  isConfigured(): boolean;
  sendToTopic(params: SendToTopicParams): Promise<string>;
}
