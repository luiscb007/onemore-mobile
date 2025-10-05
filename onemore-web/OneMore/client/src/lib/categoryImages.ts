// Category-based default images using data URIs with gradients and emojis
export function getCategoryImage(category: string): string {
  const images: Record<string, string> = {
    arts: createGradientImage('🎨', '#FF6B9D', '#C44569'),
    community: createGradientImage('🤝', '#4FACFE', '#00F2FE'),
    culture: createGradientImage('🎭', '#A8EDEA', '#FED6E3'),
    sports: createGradientImage('⚽', '#FFD26F', '#3677FF'),
    workshops: createGradientImage('💡', '#6A82FB', '#FC5C7D'),
  };
  
  return images[category] || images.community;
}

function createGradientImage(emoji: string, colorStart: string, colorEnd: string): string {
  // Create SVG with gradient background and emoji
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 800 400">
      <defs>
        <linearGradient id="grad-${emoji}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${colorStart};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${colorEnd};stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="800" height="400" fill="url(#grad-${emoji})" />
      <text x="400" y="230" font-size="140" text-anchor="middle" fill="white" opacity="0.9">${emoji}</text>
    </svg>
  `.trim();
  
  // Convert SVG to data URI
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

export const categoryConfig = {
  arts: { emoji: '🎨', label: 'Arts', gradient: ['#FF6B9D', '#C44569'] },
  community: { emoji: '🤝', label: 'Community', gradient: ['#4FACFE', '#00F2FE'] },
  culture: { emoji: '🎭', label: 'Culture', gradient: ['#A8EDEA', '#FED6E3'] },
  sports: { emoji: '⚽', label: 'Sports', gradient: ['#FFD26F', '#3677FF'] },
  workshops: { emoji: '💡', label: 'Workshops', gradient: ['#6A82FB', '#FC5C7D'] },
} as const;
