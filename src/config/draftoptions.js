const draftOptions = {};

draftOptions.groups = {
  preferences: ["sa", "paperless"],
  advanced: ["only", "complete", "margin", "units", "locale", "layout"]
};

draftOptions.config = {
  sa: null,
  paperless: null,
  only: null,
  margin: { mm: 2, min: 0, max: 25 },
  units: null,
  locale: null,
  complete: null,
  layout: null
};

export default draftOptions;
