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
            {
              type: <code>Object</code>,
              description: 'Required data to configure CRUD.',
              configuration: <Link to="/docs/VueJs/Components/Qcrud#cruddata-configuration">Go to Configuration</Link>
            },
          ],
          [
            'customData',
            {
              type: <code>Object</code>,
              description: <>Same structure as <code>crudData</code> but can change CRUD configuration without modifying
                the main CRUD configuration, only within the component.</>
            },
          ],
          [
            'title',
            {type: <code>String</code>, description: 'CRUD title to show on the index section.'},
          ],
          [
            'type',
            {
              type: <code>String</code>,
              description: 'The type property is used to define how the CRUD component will be displayed.',
              types: <Link to="/docs/VueJs/Components/Qcrud#crud-types">Go to Types</Link>
            },
          ],
          [
            'crudProps',
            {
              type: <code>Object</code>,
              description: <>It is used to define specific properties
                when <code>button-create</code> or <code>select</code> is selected. These custom properties can
                configure the behavior and appearance of the component based on the choice of <code>type</code>.</>
            },
          ],
          [
            'defaultConfig',
            {
              type: <code>Object</code>,
              description: <>This property is used to define how the items will be displayed when
                the <code>select</code> type is selected. It can have two values: <code>label, value/id</code>. This
                allows you to specify which field in the data will be used as the label (<code>label</code>) and which
                field will be used as the identifier (<code>value</code> or <code>id</code>). By default, the "title"
                and "id" fields will be used, respectively.</>
            },
          ],
          [
            'value',
            {
              type: <code>Object</code>,
              description: <>This property is used as part of the model (<code>v-model</code>) when working with
                the <code>select</code> type. It allows you to select an item or set a specific value for the
                selector.</>
            },
          ],
        ]
      }
    }
  ]
}

export const crudTypes = [
  [
    'button-create',
    'This will display a single button that allows opening the item creation form.'
  ],
  [
    'select',
    'In this mode, the selector (used in dynamicField) will be used to interact with the items.'
  ],
  [
    'full',
    'This option will display the full CRUD component, including all available functionalities and elements.'
  ]
]

export const crudDataConfig = [
  [
    'crudId',
    {type: <code>Integer</code>, description: <>Unique ID for CRUD. E.g., <code>this.$uid()</code>.</>},
  ],
  [
    'entityName',
    {
      type: <code>String</code>,
      description: <>Entity name to manage <Link to="/docs/VueJs/modules/QSite/QsitePlugins#hook">hooks</Link>; this
        data is called from the <Link to="/docs/VueJs/modules/QSite/QsiteConfig#main">main module config</Link>.
        E.g., <code>config("main.qsite.entityNames.recommendation")</code>.</>
    },
  ],
  [
    'apiRoute',
    {type: <code>String</code>, description: 'API route to request data.'},
  ],
  [
    'permission',
    {
      type: <code>String</code>,
      description: <>Permission name. This permission should contain only the following
        format: <code>moduleName.entityName</code>. The CRUD component fills in the standard names for all CRUD
        permissions (<code>create, index, edit, destroy</code>).</>
    },
  ],
  [
    'extraFromField',
    {type: <code>String</code>, description: 'Config name to request additional CRUD fields from the backend.'},
  ],
  [
    'create',
    {
      type: <code>Object</code>,
      description: <>Configuration for the create action. Set as <code>false</code> to disable this CRUD action.</>,
      params: <Link to="/docs/VueJs/Components/Qcrud#create-params">Go to Params</Link>
    },
  ],
  [
    'read',
    {
      type: <code>Object</code>,
      description: 'Configuration for the read action.',
      params: <Link to="/docs/VueJs/Components/Qcrud#read-params">Go to Params</Link>
    },
  ],
  [
    'update',
    {
      type: <code>Object</code>,
      description: <>Configuration for the update action. Set as <code>false</code> to disable this CRUD action.</>,
      params: <Link to="/docs/VueJs/Components/Qcrud#update-params">Go to Params</Link>
    },
  ],
  [
    'delete',
    {
      type: <code>Boolean</code>,
      description: <>Configuration to delete action. Set as <code>false</code> to disable this CRUD action.</>
    },
  ],
  [
    'formLeft',
    {type: <code>Object</code>, description: 'Array list with dynamic fields to render on the form\'s left part.'},
  ],
  [
    'formRight',
    {type: <code>Object</code>, description: 'Array list with dynamic fields to render on the form\'s right part.'},
  ],
  [
    'getDataForm',
    {
      type: <code>Function</code>,
      description: <>This method accepts two parameters, <code>data</code> and <code>typeForm</code> (create or update).
        If this method is defined, it intercepts the data before the create or update request to allow modification of
        the data before sending it.</>
    },
  ],
  [
    'handleFormUpdates',
    {
      type: <code>Function</code>,
      Params: <code>formData, changedFields, formType</code>,
      description: "Monitors each change that occurs in the form, allowing the incorporation of custom logic. When a change in a value is detected, it provides the ability to make decisions on whether to modify another value accordingly.",
      example: <CodeBlock language="js">
        {
          `handleFormUpdates: (formData, changedFields, formType) => {
  return new Promise(resolve => {
    if (changedFields.includes('entityType')) formData.type = null
    resolve(formData)
  })
}`
        }
      </CodeBlock>
    },
  ]
]

export const createParams = [
  [
    'title',
    {type: <code>String</code>, description: 'Title to show on the button action.'},
  ],
  [
    'to',
    {type: <code>Object</code>, description: 'Vue route to redirect to a custom form.'},
  ],
  [
    'toExternalUrl',
    {type: <code>String</code>, description: 'URL to redirect to an external URL.'},
  ],
  [
    'method',
    {
      type: <code>Function</code>,
      description: 'Method to manually create the request. This should return a promise response.'
    },
  ],
  [
    'customFormProps',
    {
      type: <code>Object</code>,
      description: 'This attribute allows you to customize the form properties when creating a new element.',
      example: <CodeBlock language="js">
        {
          `create: {
  customFormProps: {
    type: {
      props: {
        readonly: true
      }
    }
  }
}`
        }
      </CodeBlock>
    }
  ],
]

export const readParams = [
  [
    'columns',
    {
      type: <code>Array</code>,
      description: <>Format of <a
        href="https://v1.quasar.dev/vue-components/table#defining-the-columns">quasar-table-columns</a> to display CRUD
        data.</>,
      params: <Link to="/docs/VueJs/Components/Qcrud#read-columns-params">Go to Params</Link>,
      example: <CodeBlock language="js">
        {
          `columns: [
  {name: 'id', label: this.$tr('ui.form.id'), field: 'id', style: 'width: 50px'},
  {name: 'name', label: this.$tr('ui.form.title'), field: 'title', align: 'rigth'},
  {name: 'phone', label: this.$tr('ui.form.phone'), align: 'left', format: val => '<i class="fa-light fa-phone">', tooltip: this.$tr('ui.form.tooltip'), action: (item) => this.getPhoneNumber(item) }
  //...
]`
        }
      </CodeBlock>
    },
  ],
  [
    'requestParams',
    {type: <code>Object</code>, description: 'Standard API params to request data.'},
  ],
  [
    'filters',
    {
      type: <code>Object</code>,
      description: <>Array list with <Link to="/docs/VueJs/Components/dynamicField">dynamic-fields</Link> to render and
        add filters to the request.</>
    },
  ],
  [
    'actions',
    {
      type: <code>Array</code>,
      description: 'Actions for each row in the table.',
      props: <Link to="/docs/VueJs/Components/Qcrud#read-actions-params">Go to Props</Link>
    },
  ],
  [
    'showAs',
    {
      type: <code>String</code>,
      description: <>Define view type between <code>grid</code> and <code>table</code> by default.</>
    },
  ],
  [
    'allowToggleView',
    {type: <code>Boolean</code>, description: <code>Enable/Disable the button action to change view.</code>},
  ],
  [
    'rowsPerPageOptions',
    {type: <code>Array</code>, description: 'Change the pagination options to display.'},
  ],
  [
    'grid',
    {
      type: <code>Object</code>,
      description: 'Configure view grid mode.',
      props: <Link to="/docs/VueJs/Components/Qcrud#read-grid-params">Go to Props</Link>
    },
  ],
  [
    'excludeParams',
    {type: <code>Array</code>, description: 'Define the exclue actions in the pageAction'},
  ],
]

export const updateParams = [
  [
    'title',
    {type: <code>String</code>, description: 'Title to show on the button action.'},
  ],
  [
    'to',
    {type: <code>Object</code>, description: 'Vue route to redirect to a custom form.'},
  ],
  [
    'requestParams',
    {type: <code>Object</code>, description: 'Standard API params to request data for updating a row.'},
  ],
  [
    'method',
    {
      type: <code>Function</code>,
      description: 'Method to manually create the request. This should return a promise response.'
    },
  ],
  [
    'customFormProps',
    {
      type: <code>Object</code>,
      description: 'This attribute allows you to customize the form properties when updating a new element.',
      example: <CodeBlock>
        {
          `update: {
  customFormProps: {
    type: {
      props: {
        readonly: true
      }
    }
  }
}`
        }
      </CodeBlock>
    }
  ],
]

export const readActionsParams = [
  [
    'label/tooltip',
    {type: <code>String</code>},
  ],
  [
    'icon',
    {type: <code>String</code>},
  ],
  [
    'color',
    {type: <code>String</code>},
  ],
  [
    'action',
    {type: <code>Function</code>, description: 'Action to be executed when this action is triggered.'},
  ]
]

export const readGridParams = [
  [
    'colClass',
    {type: <code>String</code>, description: 'Grid distribution.'},
  ],
  [
    'component',
    {
      type: <code>Function</code>,
      description: <>Custom card component to render as a card.<br/>E.g., <CodeBlock language="js">() =>
        import('@imagina/qappointment/_components/crud/appointmentCard')</CodeBlock></>
    },
  ]
]

export const readColumnParams = [
  [
    'name',
    {
      type: <code>String</code>,
      description: <>The name of the attribute used when selecting a row. For example, in a user
        table, <code>row.name</code> will return the name of the user.</>
    }
  ],
  [
    'field',
    {
      type: <code>String</code>,
      description: 'Specifies the name of the attribute that contains the data to be displayed in the column.'
    }
  ],
  [
    'sortable',
    {
      type: <code>Boolean</code>,
      description: 'Allows defining whether the column is sortable, enabling the table to be sorted by the values in this column.'
    }
  ],
  [
    'align',
    {
      type: <code>String</code>,
      description: 'Specifies the alignment of the content in the column, such as "left," "center," or "right.'
    }
  ],
  [
    'format',
    {
      type: <code>String</code>,
      description: 'Used to customize the content within the column. For example, it can be used to insert icons.'
    }
  ],
  [
    'tooltip',
    {
      type: <code>string</code>,
      description: <>Allows setting a custom text that will be displayed when hovering over the column. By default, the
        tooltip will display the content of the <code>row.field</code>.</>
    }
  ],
  [
    'action',
    {
      type: <code>Function</code>,
      description: 'Defines the function that is executed when selecting the cell. It can be a custom function that performs a specific action in response to cell selection.'
    }
  ],
]

