// =====================================
// RENDER BOARD SYSTEM
// =====================================

import { boardData } from "./state.js";


// ===============================
// DATE FORMAT
// ===============================

function formatDate(isoString){

    if(!isoString) return "";

    const date = new Date(isoString);

    return date.toLocaleDateString(
        undefined,
        {
            month:"short",
            day:"numeric",
            hour:"2-digit",
            minute:"2-digit"
        }
    );
}


// ===============================
// TOAST
// ===============================

export function showToast(message,type="info"){

    const container = document.getElementById(
        "toast-container"
    );

    if(!container) return;


    const toast = document.createElement("div");

    toast.className = `toast toast-${type}`;


    toast.innerHTML = `

        <span>${message}</span>

        <button class="toast-close">
            ✕
        </button>

    `;


    toast.querySelector(".toast-close").onclick = () => {
        toast.remove();
    };


    container.appendChild(toast);


    setTimeout(()=>{
        toast.remove();
    },4000);

}



// ===============================
// MAIN RENDER FUNCTION
// ===============================

export function renderBoard(){

    const columns = [
        "todo",
        "inprogress",
        "done"
    ];


    columns.forEach(columnId=>{


        const container = document.getElementById(
            `cards-${columnId}`
        );


        const badge = document.getElementById(
            `count-${columnId}`
        );


        if(!container) return;


        const cards = boardData[columnId] || [];


        if(badge){

            badge.innerText = cards.length;

        }


        container.innerHTML = "";


        if(cards.length === 0){


            container.innerHTML = `

            <div class="empty-placeholder">

                <div class="empty-icon">
                    📋
                </div>

                <h4>
                    No Tasks Found
                </h4>

                <p>
                    Create your first task
                </p>

            </div>

            `;


            return;

        }



        cards.forEach(cardData=>{


            const card = createCard(
                cardData,
                columnId
            );


            container.appendChild(card);


        });


    });


    updateDashboard();

}





// ===============================
// CREATE CARD
// ===============================

function createCard(cardData,columnId){


    const card = document.createElement(
        "article"
    );


    card.className = "card";


    card.id = cardData.id;


    card.draggable = true;


    card.dataset.id = cardData.id;


    card.dataset.column = columnId;



    card.innerHTML = `

    <div class="card-body">


        <h3 class="card-title">

            ${escapeHTML(cardData.title)}

        </h3>


        ${
        cardData.description ?

        `

        <p class="card-desc">

            ${escapeHTML(cardData.description)}

        </p>

        `

        :

        ""

        }



        <div class="card-footer">


            <time class="card-time">

                ${formatDate(cardData.createdAt)}

            </time>



            <div class="card-actions">


                <button 
                class="action-btn edit-btn"
                data-id="${cardData.id}">

                    ✏️

                </button>



                <button
                class="action-btn delete-btn"
                data-id="${cardData.id}">

                    🗑

                </button>


            </div>


        </div>


    </div>

    `;


    return card;

}





// ===============================
// DASHBOARD UPDATE
// ===============================

function updateDashboard(){


    const total =
    boardData.todo.length +
    boardData.inprogress.length +
    boardData.done.length;


    const completed =
    boardData.done.length;


    const pending =
    boardData.todo.length +
    boardData.inprogress.length;


    const percent = total
    ?
    Math.round(
        (completed / total) * 100
    )
    :
    0;



    const totalEl =
    document.getElementById(
        "totalTasks"
    );


    const pendingEl =
    document.getElementById(
        "pendingTasks"
    );


    const completedEl =
    document.getElementById(
        "completedTasks"
    );


    const rateEl =
    document.getElementById(
        "completionRate"
    );



    if(totalEl)
    totalEl.innerText = total;


    if(pendingEl)
    pendingEl.innerText = pending;


    if(completedEl)
    completedEl.innerText = completed;


    if(rateEl)
    rateEl.innerText = percent+"%";



    const fill =
    document.getElementById(
        "progressFill"
    );


    const text =
    document.getElementById(
        "progressPercent"
    );



    if(fill)
    fill.style.width = percent+"%";


    if(text)
    text.innerText = percent+"%";


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