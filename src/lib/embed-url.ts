export const EMBED_BASE_URL = process.env.SUBNOTO_EMBED_BASE_URL ?? "https://app.subnoto.com";
export const EMBED_SIGN_PATH = "/embeds/sign";

export function buildEmbedSignUrl(iframeToken: string): string {
    return `${EMBED_BASE_URL}${EMBED_SIGN_PATH}#t=${iframeToken}`;
}
