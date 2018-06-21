import {templatingLoop as loop, escapeSpecialChars as escape} from '../javascript/lib/helpers.js'
export default function (args) {
  return `
    <select name="assignee" id="assignee" class="c-txt__input c-txt__input--select">
        <option value="">-</option>
        ${loop(
    args.assignees,
    assignee => `<option value="${escape(assignee.name)}">${escape(assignee.name)}</option>`
  )}
    </select>
  `
}
