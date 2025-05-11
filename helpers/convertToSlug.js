import unicode from "unidecode";

export const convertToSlug = (text) => {

  const unicodeText = unicode(text);

  const slug = unicodeText
  .replace(/\s+/g, "-")
  .replace(/-+/g, "-")
  .toLowerCase();

  return slug;
}