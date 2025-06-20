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
            { type: 'dropdown', source: ['Male', 'Female'] }
        ],
        // Not working
        // cells: {
        //     A1: { type: 'dropdown', source: ['Male', 'Female'] }
        // },
    }],
})

