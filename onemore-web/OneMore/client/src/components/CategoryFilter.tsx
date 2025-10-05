interface CategoryFilterProps {
  categories: Array<{ id: string; name: string; emoji: string }>;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export function CategoryFilter({ categories, selectedCategory, onCategoryChange }: CategoryFilterProps) {
  return (
    <div className="px-4 py-2.5 bg-background sticky top-16 z-40 border-b border-border">
      <div className="flex space-x-1.5 overflow-x-auto pb-1">
        {categories.map((category) => (
          <button
            key={category.id}
            data-testid={`button-category-${category.id}`}
            onClick={() => onCategoryChange(category.id)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium touch-target transition-colors ${
              selectedCategory === category.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            {category.emoji} {category.name}
          </button>
        ))}
      </div>
    </div>
  );
}
