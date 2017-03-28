foam.CLASS({
    package: 'foam.u2.grid',
    name: 'GridView',
    extends: 'foam.u2.Element',

    requires: [
        'foam.u2.Element',
        'foam.u2.grid.GridCell',
        'foam.u2.grid.GridHeaderCell'
    ],

    exports: [
        // data.
        'data as dao',

        // the data entry being selected, not the cell. 
        'entrySelection',

        //the row and clumn properties the cell corresponds to
        'rowSelectionProperty',
        'colSelectionProperty',
        //for row and column seletion
        'rowHeaderSelectionProperty',
        'colHeaderSelectionProperty',
        'rowHeaderUndefinedMatch',
        'colHeaderUndefinedMatch'
    ],

    axioms: [
      foam.u2.CSS.create({
          code: function() {/*
            ^grid-table table {
                border: 1px solid black;
                border-collapse: collapse;
            }

            ^grid-table tr td {
                border: 1px solid black;
            }

            ^hidden {
              display: none !important;
            }

            ^grid-table tr td [hidden]{
                display: none;
            }
          */}
        })
      ],

    properties: [
        /*
         *----------------------------------- DAO and data source ----------------------------
         */
        {
            name: 'data',
            postSet: function(old, nu){
                old && old.on && old.on.unsub && old.on.unsub(this.onDataUpdate);
                nu && nu.on && nu.on.sub(this.onDataUpdate);
                this.onDataUpdate();
            }
        },
        {
          class: 'Class',
          name: 'of' 
        },

        /*
         *---------------------------------- Row and Column generation : parameters -----------------------
         */
        //group by row first, then columns.
        {
            //a PROPERTY object from foam2
            //e.g. myFieldworker.STATUS
            name: 'colProperty',
            documentation: 'foam.core.Property Object or string. '
        },
        {
            name: 'rowProperty',
            documentation: 'foam.core.Property Object or string. '
        },
        /*
        //implement later. order rows by some property, up or down.
        //can be expanded in to rowOrderProperties later. 
        //actually,
        {
            name: 'rowOrderProperty', 
        },
        */
        
        {
            //TODO: 
            name: 'makeRowPredicate',
            //class: 'Function'
        },
        
        {
            name: 'makeColPredicate',
            //class: 'Function'
        }, 

        {
            name: 'rowDAOMatchUndefined',
            documentation: 'allowing match for null or undefined. \n the alternative is to have a staging area.', 
            class: 'Boolean', 
            value: false
        }, 
        {
            name: 'colDAOMatchUndefined',
            class: 'Boolean', 
            value: false
        },
        {
            name:'colHeaderUndefinedMatch',
            value: '_col'
        },
        {
            name:'rowHeaderUndefinedMatch',
            value: '_row'
        },

        /*
         *---------------------------------- Header Generation --------------------
         */
         
         {
            name: 'gridRowHeaderCellView',
            class: 'Class',
         },
        {
            name: 'gridColHeaderCellView',
            class: 'Class',
         },
        {
            name: 'gridCornerHeaderCellView',
            class: 'Class',
         },        
         
        /*
         *---------------------------------- Row and Column generation : data source -----------------------
         */
        {
            //used to generate colPropertiesArray
            name: 'colPropertiesDAO',
            postSet: function(old, nu){
                nu && nu.on && nu.on.sub(this.onColPropertiesDAOUpdate);
                this.onColPropertiesDAOUpdate();
                
            }
        },
        {
            name: 'rowPropertiesDAO',
            postSet: function(old, nu){
                nu.on.sub(this.onRowPropertiesDAOUpdate);
                this.onRowPropertiesDAOUpdate();
            }
        },
        {
            //Possible Row PropertiesArray.
            //can be supplied by user, or extrated from data using colProperty. 
            name: 'colPropertiesArray',
            value: [], 
            postSet: function(){
                this.onDataUpdate();
            }
        },
        {
            //Possible Row PropertiesArray.
            //can be supplied by user, or extrated from data using colProperty. 
            name: 'rowPropertiesArray',
            value: [],
            postSet: function(){
                this.onDataUpdate();
            }
        },
        
        /*
         *----------------------------------- cell, row and column Selection -----------------
         */
        {
            name: 'entrySelection',
            postSet: function(old, nu){
                var oldName = old?old.name:old;
                var nuName = nu?nu.name:nu; 
                console.log('entrySelection changed from ' + oldName + ' to ' + nuName); 
            }
        },
        {
            name: 'rowHeaderSelectionProperty',
            documentation: 'for row header selection'
        }, 
        {
            name: 'colHeaderSelectionProperty',
            documentation: 'for column header selection'
        }, 
        {
            name: 'rowSelectionProperty',
            documentation: 'for normal cell selection'
        },
        {
            name: 'colSelectionProperty'
        }, 
        
        /*
         *---------------------------------- Cell and Cell wrapper ------------------------------
         */
        {
            class: 'Class',
            documentation: 'rendering of each entry of the cell. ', 
            name: 'cellView'
        },
        {
            class: 'Class',
            documentation: 'wrapperDAO to load extra property objects for the data, if necessary. e.g., ReferenceDAO. ', 
            name: 'wrapperDAOClass'
        }, 
        {
            name: 'cellWrapperClass',
            class: 'Class'
        }, 
        
        /*
         *----------------------------------- Display Elements -----------------------------------
         */
        
        {
            name: 'body',
            factory: function(){this.Element.create().setNodeName('tbody');}
        }, 
        {
            name: 'cellArray',
            factory: function(){return []; }
        },
        {
            name: 'rowArray',
            factory: function(){return []; },
        },
        {
            name: 'visibleRowIds',
            documentation: 'toggles the visibility of Rows. ',
            factory: function(){return []; },
            postSet: function(old, nu){
                this.updateRowVisibility(old, nu);
            }
        }
    ],

    methods:
    [
        function init() {
            //
            // FIXME: this explicit sub is required at the moment
            // colPropertiesArray is working ok
            //
            this.propertyChange.sub(this.ROW_PROPERTIES_ARRAY.name, this.refreshGrid);
        },

        function initE() {
            this.refreshGrid();
            this.cssClass(this.myCls('grid-table')).
            start('table').
                add(this.body$).
            end('table');
            this.start(this.STOP, {data:this}).end();
        },

        function refreshGrid(sub, p, name, obj) {
            var self = this;
            if (sub && sub.src.rowPropertiesArray) {
                //
                // When invoked via propertyChange 'this' is not an instance of GridView
                //
                self = sub.src;
            }
            var b  = foam.u2.Element.create().setNodeName('tbody');
            self.cellArray = []; //hopefully I won't need self anymore.

            //rowPropertiesArray and colPropertiesArray should already by populated.
            //populating the table row by row.
            for (var i=-1; i< self.rowPropertiesArray.length; i++){
                var r = foam.u2.Element.create(null, self).setNodeName('tr');
                var currCellRow = [];
                for (var j=-1; j< self.colPropertiesArray.length; j++){
                    //corner of cell.
                    if (i == -1 && j ==-1){
                        var cornerCell = self.GridHeaderCell.create({
                            name: '/',
                            headerCellView: self.gridCornerHeaderCellView,
                        }, self);
                        r.add(cornerCell);
                    }else if (j==-1){ //header row
                        var rowHeaderCell = self.GridHeaderCell.create({
                            data: self.rowPropertiesArray[i]!==undefined?self.rowPropertiesArray[i]:self.rowHeaderUndefinedMatch,
                            property: self.rowProperty,
                            isRowHeader: true,
                            headerCellView: self.gridRowHeaderCellView,
                        }, self);
                        rowHeaderCell.sub('selected', self.onRowSelect);
                        r.add(rowHeaderCell);
                    }else if (i==-1){ //header column
                        var colHeaderCell = self.GridHeaderCell.create({
                            data: self.colPropertiesArray[j]!==undefined?self.colPropertiesArray[j]:self.colHeaderUndefinedMatch,
                            property: self.colProperty,
                            isColHeader: true,
                            headerCellView: self.gridColHeaderCellView,
                        }, self);
                        colHeaderCell.sub('selected', self.onColSelect);
                        r.add(colHeaderCell);

                    }else {
                        var currCell = self.GridCell.create({
                                data$: self.data$,
                                cellView: self.cellView, 
                                rowMatch: self.rowPropertiesArray[i],
                                colMatch: self.colPropertiesArray[j],
                                rowProperty: self.rowProperty,
                                colProperty: self.colProperty,
                                order: self.order,
                                wrapperClass: self.cellWrapperClass,
                                wrapperDAOClass: self.wrapperDAOClass,
                                makeColPredicate: self.makeColPredicate,
                                makeRowPredicate: self.makeRowPredicate
                            }, self);

                        r.add(currCell);
                        currCellRow.push(currCell);
                    }
                }
                //all cells added to the row.
                b.add(r);

                if (i == -1) {
                    self.headerRow = r;
                } else {
                    var key;
                    if (! self.rowPropertiesArray[i]) key = '';
                    else {
                        key = (self.matchRowId || self.rowPropertiesArray[i].id)?self.rowPropertiesArray[i].id:self.rowPropertiesArray[i];
                    }
                    self.rowArray.push([key, r]);
                }
                if (i!=-1){
                    self.cellArray.push(currCellRow);
                }
            }
            self.body = b;
            self.updateRowVisibility(); 
        },

        function populateRowPropertiesArray()
        {
            if (this.rowPropertiesDAO){
                this.rowPropertiesDAO.select().then(function(result){
                    if (!result || ! result.a || !result.a.length){
                        console.log('no Row Property detected from DAO');
                        return;
                    }else {
                        this.rowPropertiesArray = result.a;
                    }
                    if (this.rowDAOMatchUndefined){
                        this.rowPropertiesArray.push(undefined); 
                    }
                    this.refreshGrid();
                }.bind(this));
            }
        },

        function populateColPropertiesArray(){
            if (this.colPropertiesDAO){
                this.colPropertiesDAO.select().then(function(result){
                    if (!result || ! result.a || !result.a.length){
                        console.log('no Column Property detected from DAO');
                        return;
                    }else {
                        this.colPropertiesArray = result.a; 
                    }
                    if (this.colDAOMatchUndefined){
                        this.colPropertiesArray.push(undefined); 
                    }
                    this.refreshGrid();
                }.bind(this));
            }
        },
        
        // if no old,nu specified, then up date everything.
        //else only toggle the visibility of rows that are changed. 
        function updateRowVisibility(old, nu){
            // if no arguments, redraw everything: i.e., pretend old is undefined, nu is what ever it is now. 
            if (arguments.length ===0){
                if (!this.visibleRowIds.length){
                    this.rowArray.forEach(function(row){row[1].enableCls(this.myCls('hidden'), false);}.bind(this));
                }else {
                    this.rowArray.forEach(function(row){
                        // upon the change of visibility
                        var key = row[0]?row[0]:''; 
                        row[1].enableCls(this.myCls('hidden'), (this.visibleRowIds.indexOf(key)==-1)?true:false); 
                    }.bind(this));
                }
                return; 
            }
            
            console.log('visibleRowIds post set: ' + old || "" + ' --> ' + nu||""); 
            // if old and nu are both not arrays, show everything. 
            if (!foam.Array.isInstance(nu) && !foam.Array.isInstance(old)){
                console.log('old and nu both not arrays'); 
                return;
            }
            // if array of visibleRowIds are unchanged, do nothing. 
            if (foam.Array.isInstance(nu) && foam.Array.isInstance(old) && foam.Array.compare(nu, old) === 0){
                console.log('old and nu are the same'); 
                return;
            }
            if (foam.Array.isInstance(nu)){
                if (! foam.Array.isInstance(this.rowArray)) return;
                if (!nu.length){
                    this.rowArray.forEach(function(row){row[1].enableCls(this.myCls('hidden'), false);}.bind(this));
                }else {
                    this.rowArray.forEach(function(row){
                        // upon the change of visibility
                        var key = row[0]?row[0]:''; 
                        if ((nu.indexOf(key) == -1) || (!old || old.indexOf(key) == -1 )){
                            console.log('changing visibility of ' + key + ", " + row[1].id); 
                            row[1].enableCls(this.myCls('hidden'), (nu.indexOf(key)==-1)?true:false);
                        }
                    }.bind(this));
                }
            }
        }
    ],

    actions: [
        {
            name: 'stop',
            code: function(){
                debugger;
            }
        },
    ],

    listeners: [
        {
            name: 'onSortUpdate',
            isFramed: true,
            code: function(){

                this.refreshGrid();
            }
        },

        {
            name: 'onDataUpdate',
            isFramed: true,
            code: function() {
                console.log('Data updated in GridView');
                this.refreshGrid();
            }
        },

        {
            name: 'onRowSelect',
            isFramed: true,
            code: function(s){
                console.log('row Selected');
                var row = s.src;
            }
        },

        {
            name: 'onColSelect',
            isFramed: true,
            code: function(s){
                console.log('col Selected');
                var col = s.src;
            }
        },

        {
            name: 'onRowPropertiesDAOUpdate',
            isFramed: true,
            code: function(){
                if (this.rowPropertiesDAO)
                this.populateRowPropertiesArray();
            }
        },

        {
            name: 'onColPropertiesDAOUpdate',
            isFramed: true,
            code: function(){
                if (this.colPropertiesDAO)
                this.populateColPropertiesArray();
            }
        },
    ]
});
