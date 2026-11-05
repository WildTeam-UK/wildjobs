import "./editorial-image-credit.css";

export function EditorialImageCredit({
  creatorName,
  creatorUrl,
  sourceUrl,
}: {
  creatorName: string;
  creatorUrl?: string;
  sourceUrl: string;
}) {
  return (
    <figcaption className="editorial-image-credit">
      Illustrative image by{" "}
      {creatorUrl ? (
        <a href={creatorUrl} target="_blank" rel="noopener noreferrer">
          {creatorName}
        </a>
      ) : (
        creatorName
      )}{" "}
      on{" "}
      <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
        Unsplash
      </a>
    </figcaption>
  );
}
