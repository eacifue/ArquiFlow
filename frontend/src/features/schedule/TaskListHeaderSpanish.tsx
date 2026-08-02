// gantt-task-react only exposes "Name"/"From"/"To" as hardcoded English text in
// its default header (no locale prop reaches it), so this recreates that same
// header with Spanish labels — same CSS module classes already loaded via
// "gantt-task-react/dist/index.css" (pinned to this exact dependency version),
// same markup, only the copy changes.
export function TaskListHeaderSpanish({
  headerHeight,
  fontFamily,
  fontSize,
  rowWidth,
}: {
  headerHeight: number;
  rowWidth: string;
  fontFamily: string;
  fontSize: string;
}) {
  return (
    <div className="_3_ygE" style={{ fontFamily, fontSize }}>
      <div className="_1nBOt" style={{ height: headerHeight - 2 }}>
        <div className="_WuQ0f" style={{ minWidth: rowWidth }}>
          {" Nombre"}
        </div>
        <div className="_2eZzQ" style={{ height: headerHeight * 0.5, marginTop: headerHeight * 0.2 }} />
        <div className="_WuQ0f" style={{ minWidth: rowWidth }}>
          {" Inicio"}
        </div>
        <div className="_2eZzQ" style={{ height: headerHeight * 0.5, marginTop: headerHeight * 0.25 }} />
        <div className="_WuQ0f" style={{ minWidth: rowWidth }}>
          {" Fin"}
        </div>
      </div>
    </div>
  );
}
