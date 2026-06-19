// =====================================
// APP CONTROLLER
// =====================================

import {
    boardData,
    loadTasks,
    addTask,
    updateTask,
    deleteTask,
    clearAllTasks
} from "./state.js";


import {
    renderBoard,
    showToast
} from "./render.js";


import {
    initDragAndDrop
} from "./dragdrop.js";



let editingTaskId = null;



// ===============================
// FORM TOGGLE
// ===============================

function toggleForm(columnId,show=true){

    const formWrapper =
    document.getElementById(
        `form-${columnId}`
    );


    if(!formWrapper) return;



    document
    .querySelectorAll(".card-form-wrapper")
    .forEach(el=>{

        el.classList.add("hidden");

        const form =
        el.querySelector("form");

        if(form){
            form.reset();
        }

    });



    if(show){

        formWrapper.classList.remove(
            "hidden"
        );


        const input =
        formWrapper.querySelector(
            ".title-input"
        );


        if(input){
            input.focus();
        }

    }

}



// ===============================
// EVENT LISTENERS
// ===============================

function setupListeners(){


    const board =
    document.querySelector(
        ".board-container"
    );


    if(!board) return;



    document
    .querySelectorAll(".add-card-btn")
    .forEach(btn=>{


        btn.onclick = ()=>{

            toggleForm(
                btn.dataset.column,
                true
            );

        };


    });




    document
    .querySelectorAll(".cancel-form-btn")
    .forEach(btn=>{


        btn.onclick = ()=>{

            toggleForm(
                btn.dataset.column,
                false
            );

        };


    });





    document
    .querySelectorAll(".card-form")
    .forEach(form=>{


        form.onsubmit = (e)=>{

            e.preventDefault();



            const colId =
            form.dataset.column;



            const titleInput =
            form.querySelector(
                ".title-input"
            );


            const descInput =
            form.querySelector(
                ".desc-input"
            );



            const title =
            titleInput.value.trim();


            const desc =
            descInput.value.trim();



            if(!title){

                showToast(
                    "Please enter a title",
                    "error"
                );

                return;

            }



            addTask(
                colId,
                title,
                desc
            );



            form.reset();


            toggleForm(
                colId,
                false
            );


            renderBoard();


            showToast(
                "Task added successfully!",
                "success"
            );

        };


    });






    board.onclick = (e)=>{


        const editBtn =
        e.target.closest(
            '[data-action="edit"]'
        );


        const deleteBtn =
        e.target.closest(
            '[data-action="delete"]'
        );



        if(editBtn){

            startEditing(
                editBtn.dataset.cardId
            );

            return;

        }



        if(deleteBtn){


            const taskId =
            deleteBtn.dataset.cardId;



            if(confirm(
                "Are you sure you want to delete this task?"
            )){


                deleteTask(taskId);


                renderBoard();


                showToast(
                    "Task deleted successfully",
                    "success"
                );


            }


        }


    };






    board.ondblclick = (e)=>{


        const card =
        e.target.closest(".card");


        if(
            card &&
            !card.classList.contains("editing")
        ){

            startEditing(
                card.id
            );

        }


    };







    const clearBtn =
    document.getElementById(
        "clear-board-btn"
    );



    if(clearBtn){


        clearBtn.onclick = ()=>{


            const empty =
            boardData.todo.length===0 &&
            boardData.inprogress.length===0 &&
            boardData.done.length===0;



            if(empty){

                showToast(
                    "Board is already empty",
                    "info"
                );

                return;

            }



            if(confirm(
                "Delete all tasks?"
            )){


                clearAllTasks();


                renderBoard();


                showToast(
                    "Board cleared successfully",
                    "success"
                );


            }


        };


    }






    const themeBtn =
    document.getElementById(
        "theme-toggle-btn"
    );



    if(themeBtn){


        themeBtn.onclick = ()=>{


            document.body.classList.toggle(
                "light-mode"
            );


            const light =
            document.body.classList.contains(
                "light-mode"
            );


            localStorage.setItem(
                "kanban_theme",
                light ? "light" : "dark"
            );


        };


    }


}





// ===============================
// EDIT TASK
// ===============================

function startEditing(taskId){


    if(editingTaskId){

        renderBoard();

    }



    const cardEl =
    document.getElementById(
        taskId
    );


    if(!cardEl) return;



    let task = null;



    for(let col in boardData){


        task =
        boardData[col].find(
            t=>t.id===taskId
        );


        if(task) break;


    }



    if(!task) return;



    editingTaskId = taskId;



    cardEl.classList.add(
        "editing"
    );


    cardEl.draggable = false;



    cardEl.innerHTML = `

    <form class="card-form">

        <input 
        type="text"
        class="card-input title-input"
        value="${escapeHTML(task.title)}"
        required>


        <textarea 
        class="card-input desc-input"
        rows="2">${escapeHTML(task.description || "")}</textarea>


        <div class="form-actions">

            <button class="btn btn-primary">
                Save
            </button>


            <button 
            type="button"
            class="btn btn-secondary cancel-btn">

                Cancel

            </button>

        </div>

    </form>

    `;




    const form =
    cardEl.querySelector("form");


    const titleInput =
    cardEl.querySelector(".title-input");


    const descInput =
    cardEl.querySelector(".desc-input");


    const cancelBtn =
    cardEl.querySelector(".cancel-btn");



    titleInput.focus();




    cancelBtn.onclick = ()=>{

        editingTaskId = null;

        renderBoard();

    };




    form.onsubmit = (e)=>{


        e.preventDefault();


        const newTitle =
        titleInput.value.trim();



        const newDesc =
        descInput.value.trim();



        if(!newTitle){

            showToast(
                "Title is required",
                "error"
            );

            return;

        }



        updateTask(
            taskId,
            newTitle,
            newDesc
        );


        editingTaskId = null;


        renderBoard();



        showToast(
            "Task updated successfully",
            "success"
        );


    };


}





// ===============================
// SECURITY
// ===============================

function escapeHTML(str){

    if(!str) return "";


    return str
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");

}




// ===============================
// START APP
// ===============================

document.addEventListener(
    "DOMContentLoaded",
    ()=>{


        const savedTheme =
        localStorage.getItem(
            "kanban_theme"
        );


        if(savedTheme==="light"){

            document.body.classList.add(
                "light-mode"
            );

        }



        loadTasks();

        renderBoard();

        initDragAndDrop();

        setupListeners();


    }
);