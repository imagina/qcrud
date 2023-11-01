import Link from '@docusaurus/Link';
import CodeBlock from '@theme/CodeBlock';
import React from 'react';

export const componentCrud = {
  "tabs": [
    {
      "title": "Props",
      "table": {
        "data": [
          [
            'crudData',
            { type: <code>Object</code>, description: 'Required data to configure CRUD.'},
          ],
          [
            'customData',
            { type: <code>Object</code>, description: <>Same structure as <code>crudData</code> but can change CRUD configuration without modifying the main CRUD configuration, only within the component.</>},
          ],
          [
            'title',
            { type: <code>String</code>, description: 'CRUD title to show on the index section.'},
          ]
        ]
      }
    },
    {
      "title": "crudData Configuration",
      "description": <p>This configuration should be instantiated as a Vue file with a specific structure.</p>,
      "table": {
        "data": [
          [
            'crudId',
            { type: <code>Integer</code>, description: <>Unique ID for CRUD. E.g., <code>this.$uid()</code>.</> },
          ],
          [
            'entityName',
            { type: <code>String</code>, description: <>Entity name to manage <Link to="/docs/VueJs/modules/QSite/QsitePlugins#hook">hooks</Link>; this data is called from the <Link to="/docs/VueJs/modules/QSite/QsiteConfig#main">main module config</Link>. E.g., <code>config("main.qsite.entityNames.recommendation")</code>.</>},
          ],
          [
            'apiRoute',
            { type: <code>String</code>, description: 'API route to request data.'},
          ],
          [
            'permission',
            { type: <code>String</code>, description: <>Permission name. This permission should contain only the following format: <code>moduleName.entityName</code>. The CRUD component fills in the standard names for all CRUD permissions (<code>create, index, edit, destroy</code>).</>},
          ],
          [
            'extraFromField',
            { type: <code>String</code>, description: 'Config name to request additional CRUD fields from the backend.'},
          ],
          [
            'create',
            { type: <code>Object</code>, description: <>Configuration for the create action. Set as <code>false</code> to disable this CRUD action.</>, params: <Link to="/docs/VueJs/Components/Qcrud#create-params">Go to Params</Link>},
          ],
          [
            'read',
            { type: <code>Object</code>, description: 'Configuration for the read action.', params: <Link to="/docs/VueJs/Components/Qcrud#read-params">Go to Params</Link>},
          ],
          [
            'update',
            { type: <code>Object</code>, description: <>Configuration for the update action. Set as <code>false</code> to disable this CRUD action.</>, params: <Link to="/docs/VueJs/Components/Qcrud#update-params">Go to Params</Link>},
          ],
          [
            'delete',
            { type: <code>Boolean</code>, description: <>Configuration to delete action. Set as <code>false</code> to disable this CRUD action.</>},
          ],
          [
            'formLeft',
            { type: <code>Object</code>, description: 'Array list with dynamic fields to render on the form\'s left part.'},
          ],
          [
            'formRight',
            { type: <code>Object</code>, description: 'Array list with dynamic fields to render on the form\'s right part.'},
          ],
          [
            'getDataForm',
            { type: <code>Function</code>, description: <>This method accepts two parameters, <code>data</code> and <code>typeForm</code> (create or update). If this method is defined, it intercepts the data before the create or update request to allow modification of the data before sending it.</>},
          ]
        ]
      }
    }
  ]
}

export const createParams = [
  [
    'title',
    { type: <code>String</code>, description: 'Title to show on the button action.'},
  ],
  [
    'to',
    { type: <code>Object</code>, description: 'Vue route to redirect to a custom form.'},
  ],
  [
    'toExternalUrl',
    { type: <code>String</code>, description: 'URL to redirect to an external URL.'},
  ],
  [
    'method',
    { type: <code>Function</code>, description: 'Method to manually create the request. This should return a promise response.'},
  ],
]

export const readParams = [
  [
    'columns',
    { type: <code>Array</code>, description: <>Format of <a href="https://v1.quasar.dev/vue-components/table#defining-the-columns">quasar-table-columns</a> to display CRUD data.</>},
  ],
  [
    'requestParams',
    { type: <code>Object</code>, description: 'Standard API params to request data.'},
  ],
  [
    'filters',
    { type: <code>Object</code>, description: <>Array list with <Link to="/docs/VueJs/Components/dynamicField">dynamic-fields</Link> to render and add filters to the request.</>},
  ],
  [
    'actions',
    { type: <code>Array</code>, description: 'Actions for each row in the table.', props: <Link to="/docs/VueJs/Components/Qcrud#read-actions-params">Go to Props</Link>},
  ],
  [
    'showAs',
    { type: <code>String</code>, description: <>Define view type between <code>grid</code> and <code>table</code> by default.</>},
  ],
  [
    'allowToggleView',
    { type: <code>Boolean</code>, description:  <code>Enable/Disable the button action to change view.</code>},
  ],
  [
    'rowsPerPageOptions',
    { type: <code>Array</code>, description: 'Change the pagination options to display.' },
  ],
  [
    'grid',
    { type: <code>Object</code>, description: 'Configure view grid mode.', props: <Link to="/docs/VueJs/Components/Qcrud#read-grid-params">Go to Props</Link>},
  ],
]

export const updateParams = [
  [
    'title',
    { type: <code>String</code>, description: 'Title to show on the button action.' },
  ],
  [
    'to',
    { type: <code>Object</code>, description: 'Vue route to redirect to a custom form.' },
  ],
  [
    'requestParams',
    { type: <code>Object</code>, description: 'Standard API params to request data for updating a row.' },
  ],
  [
    'method',
    { type: <code>Function</code>, description: 'Method to manually create the request. This should return a promise response.' },
  ]
]

export const readActionsParams = [
  [
    'label/tooltip',
    { type: <code>String</code> },
  ],
  [
    'icon',
    { type: <code>String</code> },
  ],
  [
    'color',
    { type: <code>String</code> },
  ],
  [
    'action',
    { type: <code>Function</code>, description: 'Action to be executed when this action is triggered.' },
  ]
]

export const readGridParams = [
  [
    'colClass',
    { type: <code>String</code>, description: 'Grid distribution.' },
  ],
  [
    'component',
    { type: <code>Function</code>, description: <>Custom card component to render as a card.<br />E.g., <CodeBlock language="js">() => import('@imagina/qappointment/_components/crud/appointmentCard')</CodeBlock></> },
  ]
]

