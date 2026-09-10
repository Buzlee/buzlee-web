"use client";

import { useTags } from "@/entities/catalog";
import { ChoiceChips } from "./choice-chips";

/**
 * Multi-select tag chips over the catalog `tags` table (the app's
 * `TagSelector` minus tag creation, which is an owner-side feature).
 */
export function TagSelector({
  selectedTagIds,
  onTagsChange,
  maxTags,
  disabled = false,
}: {
  selectedTagIds: string[];
  onTagsChange: (tagIds: string[]) => void;
  maxTags: number;
  disabled?: boolean;
}) {
  const { data: tags = [], isLoading } = useTags();
  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading tags…</p>;
  }
  if (tags.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No tags available yet.</p>
    );
  }
  const atLimit = selectedTagIds.length >= maxTags;
  return (
    <div className="flex flex-col gap-2">
      <ChoiceChips
        aria-label="Tags"
        disabled={disabled}
        maxSelected={maxTags}
        multiple
        onChange={onTagsChange}
        options={tags.map((tag) => ({ value: tag.id, label: tag.name }))}
        value={selectedTagIds}
      />
      <p className="text-xs text-muted-foreground">
        {atLimit
          ? `Up to ${maxTags} tags — remove one to pick another.`
          : `${selectedTagIds.length} of ${maxTags} selected.`}
      </p>
    </div>
  );
}
