import { forwardRef, memo } from 'react';

// Renders imported WordPress markup. `display: contents` keeps the wrapper out of
// the layout so the original theme CSS sees the same box tree as on the live site.
const RawHtml = memo(
  forwardRef(function RawHtml({ html }, ref) {
    return <div ref={ref} style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: html }} />;
  })
);

export default RawHtml;
