// Small rounded label. tone: blue | green | amber | red | purple | slate
export default function Badge({ tone = "slate", children }) {
  return <span className={`ui-badge ui-tone-${tone}`}>{children}</span>;
}
