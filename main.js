const $ = el => document.querySelector(el);
const $$ = el => document.querySelectorAll(el);

const $table = $('table');
const $head = $('thead');
const $body = $('tbody');

const ROWS = 9;
const COLUMNS = 7;
const FIRST_CHAR_CODE = 65;

const range = length => Array.from({length}, (_, i) => i);
const getColumn = i => String.fromCharCode(FIRST_CHAR_CODE + i);
let state = range(COLUMNS).map(i => range(ROWS).map(j => ({computedValue: j, value: j})));

const renderSpreadSheet = () => {


    const headerHTML = `<tr>
        <th></th>
        ${range(COLUMNS).map(i => `<th>${getColumn(i)}</th>`).join('')}
    </tr>
    `
    $head.innerHTML = headerHTML;

    const bodyHTML = range(ROWS).map(row => {return `<tr>
        <td>${row}</td>
        ${range(COLUMNS).map(column =>
             `<td data-x="${column}" data-y="${row}">
             <span>${state[column][row].computedValue}</span>
             <input type="text" value="${state[column][row].value}" />
             </td>`
            ).join('')}
    </tr>`}).join('');
    $body.innerHTML = bodyHTML;

}
function updateCell({x,y, value}){
    const newState = structuredClone(state);
    const constants = generateCellsConstants(newState);
    const cell = newState[x][y]

    cell.computedValue = computeValue(value, constants);
    cell.value = value;

    newState[x][y] = cell;

    computeAllCells(newState, generateCellsConstants(newState));
    state = newState;
    renderSpreadSheet();
}

function computeValue(value, constants){
    if(typeof value == 'number') return value;
    if (typeof value == 'string' && !value.startsWith('=')) return value;
    const formula = value.slice(1);
    let computedValue;
    try{
        //Do not use eval(), its dangerous for injection hack.
        computedValue = eval(`
        (() => {
        ${constants}
        return ${formula}    
        })();
        `);
    }
    catch(e){
        computedValue = `ERROR: e`;
    }

    return computedValue;
}

function generateCellsConstants(cells){
    return cells.map((rows,x) => {
        return rows.map((cell,y) => {
            const letter = getColumn(x);
            const cellId = `${letter}${y + 1}`;
            return `const ${cellId} = ${cell.computedValue};`
        }).join('\n');
    }).join('\n');
}

function computeAllCells(cells, constants){
    cells.forEach((rows,x) => {
        rows.forEach((cell,y) => {
            const computedValue = computeValue(cell.value, constants);
            cell.computeValue = computedValue;
        });
    });
}



$body.addEventListener('click', event => {
    const td = event.target.closest('td');
    if (!td) return;
    const {x, y} = td.dataset;
    const input = td.querySelector('input');
    const span = td.querySelector('span');
    //td.classList.add('editing');

    //Move cursor to the end
    const end = input.value.length;
    input.setSelectionRange(end,end)

    input.focus();

    input.addEventListener('keydown', (event) => {
        if(event.key == 'Enter')
            {
                input.blur();
            }
    });
    
    input.addEventListener('blur', () => {
        console.log()
        if(input.value == state[x][y].value) return;
        updateCell({x, y, value: input.value});
    }, {once: true});
});

$head.addEventListener('click', event => {
    const th = event.target.closest('th');
    if(!th) return;

    const x = [...th.parentNode.children].indexOf(th);
    if(x <= 0) return;

    let selectedColumn = x - 1;
    $$('.selected').forEach(el => el.classList.remove('selected'));
    $$(`tr td:nth-child(${x + 1})`).forEach(el => el.classList.add('selected'));

    document.addEventListener('keydown', event => {
        if(event.key == 'Backspace' && selectedColumn != null){
            range(ROWS).forEach(row => {
                updateCell({x: selectedColumn, y: row, value: ''});
            });

            renderSpreadSheet();
        }
    });

    document.addEventListener('copy', event => {
        if(selectedColumn != null){
            const columnValues = range(ROWS).map(row => {
                return state[selectedColumn][row].computedValue;
            });

            event.clipboardData.setData('text/plain', columnValues.join('\n'));
            event.preventDefault();
        };
    });

    document.addEventListener('click', event => {
        const {target} = event;

        const isThClicked = target.closest('th');
        const isTdClicked = target.closest('td');

        if(!isThClicked && !isTdClicked){
            $$('.selected').forEach(el => el.classList.remove('selected'));
            selectedColumn = null;
        }
    });
});

renderSpreadSheet();
