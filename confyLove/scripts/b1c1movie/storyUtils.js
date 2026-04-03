function getStoryId(value) {
  const safeId = String(value || "")
    .trim()
    .replace(/[^a-z0-9_-]+/gi, "_")
    .replace(/^_+|_+$/g, "");

  if (!safeId) {
    throw new Error('El campo "id" no existe o es invalido en story.json');
  }

  return safeId;
}

function sanitizeSegment(value, fallback) {
  const sanitized = String(value ?? "")
    .trim()
    .replace(/[^a-z0-9_-]+/gi, "_")
    .replace(/^_+|_+$/g, "");

  return sanitized || fallback;
}

function getStories(storyData) {
  if (Array.isArray(storyData)) {
    if (storyData.length === 0) {
      throw new Error("story.json esta vacio");
    }

    return storyData;
  }

  if (storyData && typeof storyData === "object") {
    return [storyData];
  }

  throw new Error("story.json debe ser un objeto o un array de objetos");
}

function getChapters(story) {
  if (!Array.isArray(story.chapters) || story.chapters.length === 0) {
    throw new Error('El campo "chapters" no existe o esta vacio en story.json');
  }

  const chapters = story.chapters.flat(Infinity).filter((chapter) => {
    return chapter && typeof chapter === "object";
  });

  const chaptersWithPrompt = chapters.filter((chapter) => {
    return typeof chapter.prompt === "string" && chapter.prompt.trim();
  });

  if (chaptersWithPrompt.length === 0) {
    throw new Error('No se encontraron chapters con un campo "prompt" valido');
  }

  return chaptersWithPrompt;
}

module.exports = {
  getChapters,
  getStories,
  getStoryId,
  sanitizeSegment,
};
