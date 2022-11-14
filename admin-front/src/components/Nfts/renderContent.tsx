export function renderContent(
  maxWidth: string,
  maxHeight: string,
  uri?: string,
) {
  if (typeof uri === 'undefined') {
    return;
  }
  if (uri.endsWith('.mp4')) {
    return (
      <video width={maxWidth} height={maxHeight} controls>
        <source src={uri} type="video/mp4" />
      </video>
    );
  }
  // assuming this is an image then (for backwards compatibility)
  return (
    <img
      src={uri}
      style={{ margin: 'auto', maxWidth: '80%', maxHeight: '80%' }}
    />
  );
}
