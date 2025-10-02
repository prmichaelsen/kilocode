"use strict"
var __importDefault =
	(this && this.__importDefault) ||
	function (mod) {
		return mod && mod.__esModule ? mod : { default: mod }
	}
Object.defineProperty(exports, "__esModule", { value: true })
exports.addTodoToTask = addTodoToTask
exports.updateTodoStatusForTask = updateTodoStatusForTask
exports.removeTodoFromTask = removeTodoFromTask
exports.getTodoListForTask = getTodoListForTask
exports.setTodoListForTask = setTodoListForTask
exports.restoreTodoListForTask = restoreTodoListForTask
exports.parseMarkdownChecklist = parseMarkdownChecklist
exports.setPendingTodoList = setPendingTodoList
exports.updateTodoListTool = updateTodoListTool
const responses_1 = require("../prompts/responses")
const clone_deep_1 = __importDefault(require("clone-deep"))
const crypto_1 = __importDefault(require("crypto"))
const types_1 = require("@roo-code/types")
const todo_1 = require("../../shared/todo")
let approvedTodoList = undefined
/**
 * Add a todo item to the task's todoList.
 */
function addTodoToTask(cline, content, status = "pending", id) {
	const todo = {
		id: id ?? crypto_1.default.randomUUID(),
		content,
		status,
	}
	if (!cline.todoList) cline.todoList = []
	cline.todoList.push(todo)
	return todo
}
/**
 * Update the status of a todo item by id.
 */
function updateTodoStatusForTask(cline, id, nextStatus) {
	if (!cline.todoList) return false
	const idx = cline.todoList.findIndex((t) => t.id === id)
	if (idx === -1) return false
	const current = cline.todoList[idx]
	if (
		(current.status === "pending" && nextStatus === "in_progress") ||
		(current.status === "in_progress" && nextStatus === "completed") ||
		current.status === nextStatus
	) {
		cline.todoList[idx] = { ...current, status: nextStatus }
		return true
	}
	return false
}
/**
 * Remove a todo item by id.
 */
function removeTodoFromTask(cline, id) {
	if (!cline.todoList) return false
	const idx = cline.todoList.findIndex((t) => t.id === id)
	if (idx === -1) return false
	cline.todoList.splice(idx, 1)
	return true
}
/**
 * Get a copy of the todoList.
 */
function getTodoListForTask(cline) {
	return cline.todoList?.slice()
}
/**
 * Set the todoList for the task.
 */
async function setTodoListForTask(cline, todos) {
	if (cline === undefined) return
	cline.todoList = Array.isArray(todos) ? todos : []
}
/**
 * Restore the todoList from argument or from clineMessages.
 */
function restoreTodoListForTask(cline, todoList) {
	if (todoList) {
		cline.todoList = Array.isArray(todoList) ? todoList : []
		return
	}
	cline.todoList = (0, todo_1.getLatestTodo)(cline.clineMessages)
}
/**
 * Convert TodoItem[] to markdown checklist string.
 * @param todos TodoItem array
 * @returns markdown checklist string
 */
function todoListToMarkdown(todos) {
	return todos
		.map((t) => {
			let box = "[ ]"
			if (t.status === "completed") box = "[x]"
			else if (t.status === "in_progress") box = "[-]"
			return `${box} ${t.content}`
		})
		.join("\n")
}
function normalizeStatus(status) {
	if (status === "completed") return "completed"
	if (status === "in_progress") return "in_progress"
	return "pending"
}
function parseMarkdownChecklist(md) {
	if (typeof md !== "string") return []
	const lines = md
		.split(/\r?\n/)
		.map((l) => l.trim())
		.filter(Boolean)
	const todos = []
	for (const line of lines) {
		// Support both "[ ] Task" and "- [ ] Task" formats
		const match = line.match(/^(?:-\s*)?\[\s*([ xX\-~])\s*\]\s+(.+)$/)
		if (!match) continue
		let status = "pending"
		if (match[1] === "x" || match[1] === "X") status = "completed"
		else if (match[1] === "-" || match[1] === "~") status = "in_progress"
		const id = crypto_1.default
			.createHash("md5")
			.update(match[2] + status)
			.digest("hex")
		todos.push({
			id,
			content: match[2],
			status,
		})
	}
	return todos
}
function setPendingTodoList(todos) {
	approvedTodoList = todos
}
function validateTodos(todos) {
	if (!Array.isArray(todos)) return { valid: false, error: "todos must be an array" }
	for (const [i, t] of todos.entries()) {
		if (!t || typeof t !== "object") return { valid: false, error: `Item ${i + 1} is not an object` }
		if (!t.id || typeof t.id !== "string") return { valid: false, error: `Item ${i + 1} is missing id` }
		if (!t.content || typeof t.content !== "string")
			return { valid: false, error: `Item ${i + 1} is missing content` }
		if (t.status && !types_1.todoStatusSchema.options.includes(t.status))
			return { valid: false, error: `Item ${i + 1} has invalid status` }
	}
	return { valid: true }
}
/**
 * Update the todo list for a task.
 * @param cline Task instance
 * @param block ToolUse block
 * @param askApproval AskApproval function
 * @param handleError HandleError function
 * @param pushToolResult PushToolResult function
 * @param removeClosingTag RemoveClosingTag function
 * @param userEdited If true, only show "User Edit Succeeded" and do nothing else
 */
async function updateTodoListTool(
	cline,
	block,
	askApproval,
	handleError,
	pushToolResult,
	removeClosingTag,
	userEdited,
) {
	// If userEdited is true, only show "User Edit Succeeded" and do nothing else
	if (userEdited === true) {
		pushToolResult("User Edit Succeeded")
		return
	}
	try {
		const todosRaw = block.params.todos
		let todos
		try {
			todos = parseMarkdownChecklist(todosRaw || "")
		} catch {
			cline.consecutiveMistakeCount++
			cline.recordToolError("update_todo_list")
			pushToolResult(
				responses_1.formatResponse.toolError("The todos parameter is not valid markdown checklist or JSON"),
			)
			return
		}
		const { valid, error } = validateTodos(todos)
		if (!valid && !block.partial) {
			cline.consecutiveMistakeCount++
			cline.recordToolError("update_todo_list")
			pushToolResult(responses_1.formatResponse.toolError(error || "todos parameter validation failed"))
			return
		}
		let normalizedTodos = todos.map((t) => ({
			id: t.id,
			content: t.content,
			status: normalizeStatus(t.status),
		}))
		const approvalMsg = JSON.stringify({
			tool: "updateTodoList",
			todos: normalizedTodos,
		})
		if (block.partial) {
			await cline.ask("tool", approvalMsg, block.partial).catch(() => {})
			return
		}
		approvedTodoList = (0, clone_deep_1.default)(normalizedTodos)
		const didApprove = await askApproval("tool", approvalMsg)
		if (!didApprove) {
			pushToolResult("User declined to update the todoList.")
			return
		}
		const isTodoListChanged =
			approvedTodoList !== undefined && JSON.stringify(normalizedTodos) !== JSON.stringify(approvedTodoList)
		if (isTodoListChanged) {
			normalizedTodos = approvedTodoList ?? []
			cline.say(
				"user_edit_todos",
				JSON.stringify({
					tool: "updateTodoList",
					todos: normalizedTodos,
				}),
			)
		}
		await setTodoListForTask(cline, normalizedTodos)
		// If todo list changed, output new todo list in markdown format
		if (isTodoListChanged) {
			const md = todoListToMarkdown(normalizedTodos)
			pushToolResult(responses_1.formatResponse.toolResult("User edits todo:\n\n" + md))
		} else {
			pushToolResult(responses_1.formatResponse.toolResult("Todo list updated successfully."))
		}
	} catch (error) {
		await handleError("update todo list", error)
	}
}
//# sourceMappingURL=updateTodoListTool.js.map
