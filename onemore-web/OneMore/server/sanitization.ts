import sanitizeHtml from 'sanitize-html';

export function sanitizeInput(input: string): string {
  return sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: 'discard',
  }).trim();
}

export function sanitizeEventData(data: any) {
  return {
    ...data,
    title: data.title ? sanitizeInput(data.title) : data.title,
    description: data.description ? sanitizeInput(data.description) : data.description,
    location: data.location ? sanitizeInput(data.location) : data.location,
    address: data.address ? sanitizeInput(data.address) : data.address,
  };
}

export function sanitizeMessageContent(content: string): string {
  return sanitizeInput(content);
}
