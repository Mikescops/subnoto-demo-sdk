export function truncateUuid(uuid: string, length = 12): string {
    if (uuid.length <= length) return uuid;
    return `${uuid.slice(0, length)}…`;
}
