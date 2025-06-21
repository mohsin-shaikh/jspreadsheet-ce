import jspreadsheet from './index.js';

import './jspreadsheet.css';
import 'jsuites/dist/jsuites.css';

window.jss = jspreadsheet;

window.instance = jspreadsheet(root, {
    tabs: true,
    toolbar: false,
    worksheets: [{
        minDimensions: [10, 10],
        columns: [
            { type: 'text' },
            {
                type: 'dropdown',
                source: [
                    { value: 'Male', text: 'Male' },
                    { value: 'Female', text: 'Female' },
                    { value: "Canada", text: "Canada" },
                    { value: "United Kingdom", text: "United Kingdom" },
                    { value: "India", text: "India" },
                    { value: "Australia", text: "Australia" },
                    { value: "Germany", text: "Germany" },
                ],
                autocomplete: true,
            }
        ],
        cells: {
            A1: { type:'html' },
            B2: { type:'number', mask: '#.##0,00' },
            B6: { type: 'dropdown', source: [12,24,36,48,60] },
            C3: { type: 'checkbox' },
            D4: { type: 'calendar', options: { format: 'YYYY-MM-DD' } },
            E5: { type: 'dropdown', source: ['Option 1', 'Option 2', 'Option 3'] },
        },
    }],
})

