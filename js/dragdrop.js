// =====================================
// DRAG AND DROP SYSTEM
// =====================================

import { moveTask, boardData } from "./state.js";
import { renderBoard, showToast } from "./render.js";


// ===============================
// DRAG VARIABLES
// ===============================

let draggedTaskId = null;
let sourceColumn = null;


// ===============================
// INITIALIZE DRAG DROP
// ===============================

export function initDragAndDrop(){

    const board = document.querySelector(
        ".board-container"
    );

    if(!board) return;


    board.addEventListener(
        "dragstart",
        (e)=>{

            const card = e.target.closest(".card");

            if(
                !card ||
                card.classList.contains("editing")
            ){
                e.preventDefault();
                return;
            }


            draggedTaskId = card.id;


            card.classList.add(
                "dragging"
            );


            const column = card.closest(".column");


            sourceColumn = column
            ?
            column.dataset.columnId
            :
            null;


            e.dataTransfer.effectAllowed = "move";


            e.dataTransfer.setData(
                "text/plain",
                card.id
            );

        }
    );



    board.addEventListener(
        "dragend",
        (e)=>{

            const card = e.target.closest(".card");


            if(card){

                card.classList.remove(
                    "dragging"
                );

            }


            document
            .querySelectorAll(".column")
            .forEach(col=>{

                col.classList.remove(
                    "drag-over"
                );

            });


            draggedTaskId = null;
            sourceColumn = null;

        }
    );



    document
    .querySelectorAll(".column")
    .forEach(column=>{


        const columnId =
        column.dataset.columnId;



        column.addEventListener(
            "dragover",
            (e)=>{

                e.preventDefault();

                e.dataTransfer.dropEffect =
                "move";

            }
        );



        column.addEventListener(
            "dragenter",
            (e)=>{

                e.preventDefault();


                column.classList.add(
                    "drag-over"
                );

            }
        );



        column.addEventListener(
            "dragleave",
            ()=>{

                column.classList.remove(
                    "drag-over"
                );

            }
        );



        column.addEventListener(
            "drop",
            (e)=>{

                e.preventDefault();


                column.classList.remove(
                    "drag-over"
                );



                if(
                    !draggedTaskId ||
                    !sourceColumn
                ){
                    return;
                }



                const cardsContainer =
                column.querySelector(
                    ".cards-container"
                );



                const dropIndex =
                getDropIndex(
                    cardsContainer,
                    e.clientY
                );



                try{


                    if(sourceColumn === columnId){


                        const tasks =
                        boardData[columnId];


                        const oldIndex =
                        tasks.findIndex(
                            task =>
                            task.id === draggedTaskId
                        );



                        if(
                            oldIndex !== -1 &&
                            oldIndex !== dropIndex &&
                            oldIndex !== dropIndex - 1
                        ){


                            const newIndex =
                            oldIndex < dropIndex
                            ?
                            dropIndex - 1
                            :
                            dropIndex;



                            moveTask(
                                draggedTaskId,
                                sourceColumn,
                                columnId,
                                newIndex
                            );


                            renderBoard();

                        }


                    }
                    else{


                        moveTask(
                            draggedTaskId,
                            sourceColumn,
                            columnId,
                            dropIndex
                        );


                        renderBoard();


                        showToast(
                            `Task moved to ${
                                column.querySelector("h2").textContent
                            }`,
                            "success"
                        );

                    }


                }
                catch(error){


                    showToast(
                        error.message,
                        "error"
                    );

                }


            }
        );


    });


}





// ===============================
// FIND DROP POSITION
// ===============================

function getDropIndex(container,y){

    const cards = [
        ...container.querySelectorAll(
            ".card:not(.dragging)"
        )
    ];


    for(
        let i = 0;
        i < cards.length;
        i++
    ){

        const box =
        cards[i].getBoundingClientRect();


        const middle =
        box.top + box.height / 2;



        if(y < middle){

            return i;

        }

    }


    return cards.length;

}