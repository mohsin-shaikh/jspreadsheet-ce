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
                    {value: "Canada", text: "Canada"},
                    {value: "United Kingdom", text: "United Kingdom"},
                    {value: "India", text: "India"},
                    {value: "Australia", text: "Australia"},
                    {value: "Germany", text: "Germany"},
                ], autocomplete: true,
            }
        ],
        cells: {
            A1: { type: 'dropdown', source: ['Male', 'Female'], autocomplete: true, }
        },
    }],
})

