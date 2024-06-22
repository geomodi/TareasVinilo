document.addEventListener('DOMContentLoaded', () => {
    const apiKey = 'patvDa3N84MeSmPqS.bea18731fee485325ba61b363719bf9188151c9932245d8f43e7cc56c645fdf2';
    const baseId = 'appexR9tFKGHjSWNE';
    const tableName = 'Vinilo';
    const apiUrl = `https://api.airtable.com/v0/${baseId}/${tableName}`;
    const headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
    };

    const taskContainer = document.getElementById('task-container');
    const sortUrgencyButton = document.getElementById('sort-urgency');
    const sortDueDateButton = document.getElementById('sort-due-date');

    const completedTasksTable = document.getElementById('completed-tasks').getElementsByTagName('tbody')[0];

    const viewModal = document.getElementById('view-modal');
    const modalCloseButton = document.getElementById('modal-close-button');
    const modalTaskText = document.getElementById('modal-task-text');
    const modalTaskComments = document.getElementById('modal-task-comments');
    const modalTaskUrgency = document.querySelector('.modal-content .task-urgency');
    const modalImagePlaceholder = document.getElementById('modal-image-placeholder');
    const newCommentInput = document.getElementById('new-comment');
    const modalPasswordInput = document.getElementById('modal-password');
    const saveCommentButton = document.getElementById('save-comment-button');
    const completeTaskCheckbox = document.getElementById('complete-task-checkbox');

    let tasks = [];
    let currentTask = null;

    async function fetchTasks() {
        try {
            const response = await fetch(apiUrl, { headers });
            const data = await response.json();
            console.log('Fetched data from Airtable:', data); // Log fetched data

            tasks = data.records.map(record => ({
                id: record.id,
                text: record.fields.Text,
                urgency: record.fields.Urgency,
                dueDate: record.fields.DueDate ? `${record.fields.DueDate}T23:00:00` : '2024-06-21T23:00:00', // Default to 11:00 PM
                comments: record.fields.Comments ? record.fields.Comments.split('\n') : [],
                imageUrl: record.fields.ImageUrl || null, // Assuming imageUrl is a field in Airtable
                status: record.fields.Status || 'Pending',
                completionDate: record.fields.Status === 'Complete' ? record.fields['Last Modified'] : null,
            }));
            renderTasks();
        } catch (error) {
            console.error('Error fetching tasks from Airtable:', error);
        }
    }

    function createTaskCard(task) {
        const card = document.createElement('div');
        card.classList.add('task-card');

        const formattedDueDate = new Date(task.dueDate).toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });

        const commentsHtml = task.comments.map(comment => `<p>${comment}</p>`).join('');

        card.innerHTML = `
            <div class="task-header">
                <div class="task-urgency">
                    ${createUrgencyIndicators(task.urgency)}
                </div>
                <span>${task.urgency}</span>
            </div>
            <div class="task-content">
                ${task.text}
            </div>
            <div class="task-comments">
                <hr>
                ${commentsHtml}
            </div>
            <div class="task-footer">
                <span>${formattedDueDate}</span>
                <span class="countdown">${calculateCountdown(task.dueDate)}</span>
            </div>
        `;

        card.addEventListener('dblclick', () => {
            openModal(task);
        });

        return card;
    }

    function openModal(task) {
        currentTask = task;
        modalTaskText.textContent = task.text;
        modalTaskComments.innerHTML = task.comments.map(comment => `<p>${comment}</p>`).join('');
        modalTaskUrgency.innerHTML = createUrgencyIndicators(task.urgency) + `<span>${task.urgency}</span>`;

        if (task.imageUrl) {
            modalImagePlaceholder.innerHTML = `<img src="${task.imageUrl}" alt="Task Image">`;
            modalImagePlaceholder.querySelector('img').addEventListener('click', () => {
                window.open(task.imageUrl, '_blank');
            });
        } else {
            modalImagePlaceholder.innerHTML = `<div class="no-image">No Image Available</div>`;
        }

        completeTaskCheckbox.checked = false;
        viewModal.style.display = 'block';
    }

    function closeModal() {
        viewModal.style.display = 'none';
        newCommentInput.value = '';
        modalPasswordInput.value = '';
        completeTaskCheckbox.checked = false;
    }

    modalCloseButton.addEventListener('click', closeModal);

    async function updateTask(taskId, newComment, repName, markComplete) {
        const task = tasks.find(t => t.id === taskId);
        const now = new Date();
        const formattedDate = now.toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });
        const commentPrefix = `${formattedDate} ${repName} escribió:`;
        const fullComment = `${commentPrefix}\n${newComment}`;

        task.comments.push(fullComment);

        const updateFields = {
            Comments: task.comments.join('\n'),
        };

        if (markComplete) {
            updateFields['Task Finished'] = `YES ${formattedDate}`;
        }

        try {
            const response = await fetch(`${apiUrl}/${taskId}`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify({ fields: updateFields }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Error details:', errorData);
                throw new Error('Failed to update task');
            }

            renderTasks();
            closeModal();
        } catch (error) {
            console.error('Error updating task:', error);
        }
    }

    saveCommentButton.addEventListener('click', () => {
        const newComment = newCommentInput.value.trim();
        const password = modalPasswordInput.value;
        const markComplete = completeTaskCheckbox.checked;

        if (newComment && password === 'simetria') {
            updateTask(currentTask.id, newComment, 'Johnatan', markComplete);
        } else {
            alert('Please enter a comment and the correct password.');
        }
    });

    function createUrgencyIndicators(urgency) {
        const indicators = [];
        for (let i = 1; i <= 10; i++) {
            const color = getColorForLevel(i, urgency);
            indicators.push(`<span class="urgency-indicator" style="background: ${color};"></span>`);
        }
        return indicators.join('');
    }

    function getColorForLevel(level, urgency) {
        if (level <= urgency) {
            if (level <= 2) {
                return 'green';
            } else if (level <= 4) {
                return `linear-gradient(to right, green, orange)`;
            } else if (level <= 6) {
                return 'orange';
            } else if (level <= 8) {
                return `linear-gradient(to right, orange, red)`;
            } else {
                return 'red';
            }
        }
        return 'rgba(0,0,0,0.1)';
    }

    function calculateCountdown(dueDate) {
        const now = new Date();
        const due = new Date(dueDate);
        const diffInMs = due - now;

        if (diffInMs <= 0) {
            return 'Overdue';
        }

        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

        if (diffInDays >= 1) {
            return `${diffInDays} days left`;
        } else {
            const hoursLeft = Math.floor(diffInMs / (1000 * 60 * 60));
            const minutesLeft = Math.floor((diffInMs % (1000 * 60 * 60)) / (1000 * 60));
            return `${hoursLeft}h ${minutesLeft}m left`;
        }
    }

    function renderTasks() {
        taskContainer.innerHTML = '';
        completedTasksTable.innerHTML = '';
        tasks.forEach(task => {
            if (task.status === 'Complete') {
                addCompletedTaskToTable(task);
            } else {
                taskContainer.appendChild(createTaskCard(task));
            }
        });
    }

    function addCompletedTaskToTable(task) {
        const row = document.createElement('tr');

        const formattedDueDate = new Date(task.dueDate).toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });

        const formattedCompletionDate = new Date(task.completionDate).toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });

        row.innerHTML = `
            <td>${task.text}</td>
            <td>${task.urgency}</td>
            <td>${formattedDueDate}</td>
            <td>${formattedCompletionDate}</td>
        `;

        completedTasksTable.appendChild(row);
    }

    sortUrgencyButton.addEventListener('click', () => {
        tasks.sort((a, b) => b.urgency - a.urgency);
        renderTasks();
    });

    sortDueDateButton.addEventListener('click', () => {
        tasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
        renderTasks();
    });

    fetchTasks();
});
