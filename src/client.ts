import { google, youtube_v3 } from "googleapis";
import { OAuth2Client } from "google-auth-library";

export class YouTubeLiveClient {
  private youtube: youtube_v3.Youtube;

  constructor(auth: OAuth2Client) {
    this.youtube = google.youtube({ version: "v3", auth });
  }

  async createBroadcast(params: {
    title: string; description?: string; scheduledStartTime?: string;
    privacyStatus?: string; enableAutoStart?: boolean; enableAutoStop?: boolean;
    enableDvr?: boolean; enableEmbed?: boolean;
  }): Promise<youtube_v3.Schema$LiveBroadcast> {
    const res = await this.youtube.liveBroadcasts.insert({
      part: ["snippet", "contentDetails", "status"],
      requestBody: {
        snippet: { title: params.title, description: params.description || "", scheduledStartTime: params.scheduledStartTime || new Date().toISOString() },
        contentDetails: { enableAutoStart: params.enableAutoStart ?? false, enableAutoStop: params.enableAutoStop ?? true, enableDvr: params.enableDvr ?? true, enableEmbed: params.enableEmbed ?? true },
        status: { privacyStatus: params.privacyStatus || "unlisted", selfDeclaredMadeForKids: false },
      },
    });
    return res.data;
  }

  async listBroadcasts(params?: { broadcastStatus?: string; maxResults?: number; pageToken?: string }): Promise<youtube_v3.Schema$LiveBroadcastListResponse> {
    const res = await this.youtube.liveBroadcasts.list({ part: ["snippet", "contentDetails", "status"], broadcastStatus: params?.broadcastStatus || "all", maxResults: params?.maxResults || 10, pageToken: params?.pageToken });
    return res.data;
  }

  async getBroadcast(broadcastId: string): Promise<youtube_v3.Schema$LiveBroadcast> {
    const res = await this.youtube.liveBroadcasts.list({ part: ["snippet", "contentDetails", "status"], id: [broadcastId] });
    const item = res.data.items?.[0];
    if (!item) throw new Error(`Broadcast not found: ${broadcastId}`);
    return item;
  }

  async updateBroadcast(params: { broadcastId: string; title?: string; description?: string; scheduledStartTime?: string; privacyStatus?: string }): Promise<youtube_v3.Schema$LiveBroadcast> {
    const current = await this.getBroadcast(params.broadcastId);
    const res = await this.youtube.liveBroadcasts.update({
      part: ["snippet", "contentDetails", "status"],
      requestBody: {
        id: params.broadcastId,
        snippet: { title: params.title || current.snippet?.title, description: params.description ?? current.snippet?.description, scheduledStartTime: params.scheduledStartTime || current.snippet?.scheduledStartTime },
        status: { privacyStatus: params.privacyStatus || current.status?.privacyStatus },
      },
    });
    return res.data;
  }

  async deleteBroadcast(broadcastId: string): Promise<void> { await this.youtube.liveBroadcasts.delete({ id: broadcastId }); }

  async bindStream(broadcastId: string, streamId: string): Promise<youtube_v3.Schema$LiveBroadcast> {
    const res = await this.youtube.liveBroadcasts.bind({ id: broadcastId, part: ["snippet", "contentDetails", "status"], streamId });
    return res.data;
  }

  async transitionBroadcast(broadcastId: string, status: string): Promise<youtube_v3.Schema$LiveBroadcast> {
    const res = await this.youtube.liveBroadcasts.transition({ id: broadcastId, broadcastStatus: status, part: ["snippet", "status"] });
    return res.data;
  }

  async insertCuepoint(broadcastId: string, durationSecs?: number): Promise<youtube_v3.Schema$Cuepoint> {
    const res = await this.youtube.liveBroadcasts.insertCuepoint({ id: broadcastId, requestBody: { cueType: "cueTypeAd", durationSecs: durationSecs || 30 } });
    return res.data;
  }

  async createStream(params: { title: string; resolution?: string; frameRate?: string; ingestionType?: string }): Promise<youtube_v3.Schema$LiveStream> {
    const res = await this.youtube.liveStreams.insert({
      part: ["snippet", "cdn", "contentDetails", "status"],
      requestBody: { snippet: { title: params.title }, cdn: { frameRate: params.frameRate || "60fps", resolution: params.resolution || "1080p", ingestionType: params.ingestionType || "rtmp" } },
    });
    return res.data;
  }

  async listStreams(params?: { maxResults?: number; pageToken?: string }): Promise<youtube_v3.Schema$LiveStreamListResponse> {
    const res = await this.youtube.liveStreams.list({ part: ["snippet", "cdn", "contentDetails", "status"], mine: true, maxResults: params?.maxResults || 10, pageToken: params?.pageToken });
    return res.data;
  }

  async getStream(streamId: string): Promise<youtube_v3.Schema$LiveStream> {
    const res = await this.youtube.liveStreams.list({ part: ["snippet", "cdn", "contentDetails", "status"], id: [streamId] });
    const item = res.data.items?.[0];
    if (!item) throw new Error(`Stream not found: ${streamId}`);
    return item;
  }

  async deleteStream(streamId: string): Promise<void> { await this.youtube.liveStreams.delete({ id: streamId }); }

  async listChatMessages(liveChatId: string, pageToken?: string): Promise<youtube_v3.Schema$LiveChatMessageListResponse> {
    const res = await this.youtube.liveChatMessages.list({ liveChatId, part: ["snippet", "authorDetails"], maxResults: 200, pageToken });
    return res.data;
  }

  async sendChatMessage(liveChatId: string, message: string): Promise<youtube_v3.Schema$LiveChatMessage> {
    const res = await this.youtube.liveChatMessages.insert({ part: ["snippet"], requestBody: { snippet: { liveChatId, type: "textMessageEvent", textMessageDetails: { messageText: message } } } });
    return res.data;
  }

  async deleteChatMessage(messageId: string): Promise<void> { await this.youtube.liveChatMessages.delete({ id: messageId }); }

  async listModerators(liveChatId: string): Promise<youtube_v3.Schema$LiveChatModeratorListResponse> {
    const res = await this.youtube.liveChatModerators.list({ liveChatId, part: ["snippet"], maxResults: 50 });
    return res.data;
  }

  async addModerator(liveChatId: string, channelId: string): Promise<youtube_v3.Schema$LiveChatModerator> {
    const res = await this.youtube.liveChatModerators.insert({ part: ["snippet"], requestBody: { snippet: { liveChatId, moderatorDetails: { channelId } } } });
    return res.data;
  }

  async removeModerator(moderatorId: string): Promise<void> { await this.youtube.liveChatModerators.delete({ id: moderatorId }); }
}
