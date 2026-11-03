import "./editorial-image-credit.css";

export function EditorialImageCredit({ creatorName, sourceUrl }: { creatorName: string; sourceUrl: string }) {
  return (
    <figcaption className="editorial-image-credit">
      Illustrative image by {creatorName} on{" "}
      <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
        Unsplash
      </a>
    </figcaption>
  );
}
