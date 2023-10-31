import Link from '@docusaurus/Link';
import React from 'react';

export const services = {
  "tabs": [
    {
      "title": "Create",
      "table": {
        "data": [
          [
            'configName',
            { type: <code>String</code>, description: <>Config name with the API route. E.g., <code>'apiRoutes.quser.users'</code>.</>},
          ],
          [
            'data',
            { type: <code>Object</code>, description: 'Record data to send the request. Every row in camelCase is transformed to snake_case.'},
          ],
          [
            'Usage',
            { example: <><code>this.$crud.create(configName, data);</code></>},
          ]
        ]
      }
    },
    {
      "title": "Index",
      "table": {
        "data": [
          [
            'configName',
            { type: <code>String</code>, description: <>Config name with the API route. E.g., <code>'apiRoutes.quser.users'</code>.</> },
          ],
          [
            'params',
            { type: <code>Object</code>, description: <>Params to configure the request.</>, params: <Link to="/docs/VueJs/modules/Qcrud/QcrudServices#crud-params">Go to Params</Link>},
          ],
          [
            'Usage',
            { example: <><code>this.$crud.index(configName, params);</code></>},
          ]
        ]
      }
    },
    {
      "title": "Show",
      "table": {
        "data": [
          [
            'configName',
            { type: <code>String</code>, description: <>Config name with the API route. E.g., <code>'apiRoutes.quser.users'</code>.</>},
          ],
          [
            'criteria',
            { type: <code>Criteria</code>, description: <>Criteria to add in the base URL request. E.g., <code>baseurl.com/api/path/(criteria)</code></>},
          ],
          [
            'params',
            { type: <code>Object</code>, description: 'Params to configure the request.', params: <Link to="/docs/VueJs/modules/Qcrud/QcrudServices#crud-params">Go to Params</Link>}
          ],
          [
            'Usage',
            {example: <code>this.$crud.show(configName, criteria, params);</code>}
          ]
        ]
      }
    },
    {
      "title": "Update",
      "table": {
        "data": [
          [
            'configName',
            { type: <code>String</code>, description: <>Config name with the API route. E.g., <code>'apiRoutes.quser.users'</code>.</>},
          ],
          [
            'criteria',
            { type: <code>Criteria</code>, description: <>Criteria to add in the base URL request. E.g., <code>baseurl.com/api/path/(criteria)</code></>},
          ],
          [
            'data',
            { type: <code>Object</code>, description: <>Record data to send the request. Every row in <code>camelCase</code> is transformed to <code>snake_case</code>.</>},
          ],
          [
            'params',
            { type: <code>Object</code>, description: 'Params to configure the request.', params: <Link to="/docs/VueJs/modules/Qcrud/QcrudServices#crud-params">Go to Params</Link>}
          ],
          [
            'Usage',
            {example: <code>this.$crud.update(configName, criteria, data, params);</code>}
          ]
        ]
      }
    },
    {
      "title": "Delete",
      "table": {
        "data": [
          [
            'configName',
            { type: <code>String</code>, description: <>Config name with the API route. E.g., <code>'apiRoutes.quser.users'</code>.</>},
          ],
          [
            'criteria',
            { type: <code>Criteria</code>, description: <>Criteria to add in the base URL request. E.g., <code>baseurl.com/api/path/(criteria)</code>.</>},
          ],
          [
            'params',
            { type: <code>Object</code>, description: 'Params to configure the request.'},
          ],
          [
            'Usage',
            { example: <code>this.$crud.delete(configName, criteria, params);</code>},
          ],
        ]
      }
    },
    {
      "title": "Post",
      "table": {
        "data": [
          [
            'configName',
            { type: <code>String</code>, description: <>Config name with the API route. E.g., <code>'apiRoutes.quser.users'</code>.</>},
          ],
          [
            'data',
            { type: <code>Object</code>, description: 'Record data to send the request.'},
          ],
          [
            'Usage',
            { type: <code>this.$crud.post(configName, data, params);</code>},
          ]
        ]
      }
    },
    {
      "title": "Get",
      "table": {
        "data": [
          [
            'configName',
            { type: <code>String</code>, description: <>Config name with the API route. E.g., <code>'apiRoutes.quser.users'</code>.</>},
          ],
          [
            'data',
            { type: <code>Object</code>, description: 'Record data to send the request.'},
          ],
          [
            'params',
            { type: <code>Object</code>, description: 'Params to configure the request.' }
          ],
          [
            'Usage',
            { example: <code>this.$crud.get(configName, params, data);</code>},
          ]
        ]
      }
    },
    {
      "title": "Put",
      "table": {
        "data": [
          [
            'configName',
            { type: <code>String</code>, description: <>Config name with the API route. E.g., <code>'apiRoutes.quser.users'</code>.</>},
          ],
          [
            'data',
            { type: <code>Object</code>, description: 'Record data to send the request.'},
          ],
          [
            'Usage',
            { type: <code>this.$crud.put(configName, data, params);</code>},
          ]
        ]
      }
    }
  ]
}

export const genericParams = [
  [
    'refresh',
    { type: <code>Boolean</code>, description: 'Define if the response request should be saved in cache.'},
  ],
  [
    'cacheTime',
    { type: <code>Integer</code>, description: 'Number of seconds to save the response request in cache.'},
  ],
  [
    'params',
    { type: <code>Object</code>, description: 'API standard params to request.'},
  ],
]
