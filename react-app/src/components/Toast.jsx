export default function Toast({ msg, type }) {
  return <div className={`toast show toast-${type}`}>{msg}</div>
}
