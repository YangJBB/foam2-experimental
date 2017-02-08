foam.CLASS({
    refines: 'foam.core.Property',
    properties: [
        {
            class: 'Function',
            name: 'validator',
        },
        {
            class: 'Function',
            name: 'tableFormatter',
            factory: function() { return function(value, obj, t){return value; }; },
        },
        {
            class: 'Function',
            name: 'gridHeaderView',
            factory: function() { return function(value, obj, t){return value; }; },
        },
        {
            name: 'sortable',
            class: 'Boolean',
            value: true, 
        },
        {
            name: 'groupByProperty',
            class: 'String',
            value: 'id',
        },
        {
            name: 'groupByLabel',
            class: 'String',
            value: 'label',
        },
        /*{
            name: 'salesforceType',
            class: 'String'
        },*/
    ],

});



// Relationship Test
foam.CLASS({
  name: 'Team',
  requires: ['Hero'], 
  properties: [ 'name', 'id' ]
});

foam.CLASS({
  name: 'Hero',
  
  requires: ['Team'],
  
  imports: [
    'TeamDAO', 
  ], 
  
  properties: [
    'id',
    {
        name: 'name',
        gridHeaderView: function(value, obj, t){
            return value; 
        },
    },
    {
        class: 'Date', 
        name: 'birthDate',
    },
    {
        class: 'Date', 
        name: 'lastSeenAlive',
        searchView: 'foam.u2.search.WeekSearchView',
        //searchView: 'foam.u2.DateView',  
        factory: function(){
            return SE.util.startOfToday();
        },
        validator: function(obj) {
                if (  obj.lastSeenAlive && obj.birthDate && (obj.lastSeenAlive < obj.birthDate) ) return 'Must be after birth date, unless you are a time traveller';
        }, 
        gridHeaderView: function(value, obj, t){
            var d = new Date(value);
            var p1 = foam.u2.Element.create('p');
            p1.add(SE.util.getDayName(d));
            var p2 = foam.u2.Element.create('p');
            p2.add(d.getDate() + "" + SE.util.getDayCardinal(d) + " " + SE.util.getShortMonthName(d));
            return foam.u2.Element.create('div').add(p1).add(p2); 
        },
    },
    
    {
        name: 'status',
        searchView: 'foam.u2.search.GroupBySearchView',
        gridHeaderView: function(value, obj, t){
            return value; 
        },
    },
    {
        name: 'organizationId',
        documentation: 'organizationId should always be the one set, instead of organization object.', 
        //hidden: true, 
        postSet: function(old, nu){
            console.log(this.name + " orgainizationId is set. " + nu);
            if (!nu){
                this.clearProperty(this.ORGANIZATION); 
            }
            if (nu && old!=nu){
              this.TeamDAO.find(nu).then(function(organization) {
                if (this.organizationId != organization.id){
                    console.log("error. organization should be set after the organizationId, ids should match."); 
                }
                  this.organization = organization;
                
              }.bind(this));
            }
        }
    },
    
    {
        name: 'organization',
        //class: 'Team', 
        groupById: "id", 
        groupByLabel: "name",
        transient: true, 
        searchView: {
            class: 'com.serviceecho.ui.search.GroupByIdSearchView',
            of: 'Team', 
            showAllChoices: true,
        },
        tableCellView: function(obj, e) {
          return obj && obj.organization && obj.organization.name; 
        },
        tableFormatter: function(value, data, t){
          return value; 
        },
        /*
         * postset should NOT exist. organization should only be changed when organizationid is. 
        postSet: function(old, nu){
            if(! nu || ! nu.id){
                this.clearProperty(this.ORGANIZATION_ID); 
            }else if (! old || !old.id || (old.id != nu.id)){
                this.organizationId = nu.id; 
            }
        },
        */
        gridHeaderView: function(value, obj, t){
            return value?value.name:"N/A"; 
        },
    }
    
    

    ],
  
  methods: [
    /*
    function init(){
        this.name$.sub(this.nameUpdate); 
        this.organizationId$.sub(this.orgUpdate);
        
        if (this.organizationId && this.TeamDAO) {
            this.TeamDAO.find(this.organizationId).then(function(organization) {
                this.organization = organization;
            }.bind(this));
        }
    },
    */
    
    function validate(){
      
    }
  ],
  
  listeners: [
    {
        name: "orgUpdate",
        code: function(){
            console.log("organiztion Updated. ");
        }
    },
    
    {
        name: "nameUpdate",
        code: function(){
            console.log("name Updated. ");
        }
    },

  ]
  
});

foam.CLASS({
  name: 'HeroCellView',
  extends: 'foam.u2.Element', 
  
  requires: ['Team', 'Hero', 'foam.u2.Element'],
  
  imports: [
  ], 
  
  properties: [
    "of",
    {
        name: 'data',
        postSet: function(old ,nu){
            nu && nu.sub && nu.sub(this.onDataUpdate);
        }, 
    },
    {
        name: 'cellView',
        factory: function(){
            return this.Element.create(null, this);
        }
    }
    
    ],
  
  methods: [
    function initE(){
        this.add(this.cellView$);
        this.attrs({ draggable: 'true' });
        this.on('dragstart', this.onDragStart); 
    },
    
    function init(){
        this.onDataUpdate();
    },
    
    function makeCellView(){
        var div = foam.u2.Element.create("div");
        if (this.data){
            div.add(foam.u2.Element.create("p").add(this.data.name));
            div.start("small").add(this.data.lastSeenAlive && this.data.lastSeenAlive.toLocaleDateString()).end("small"); 
        }
        //return div;
        this.cellView = div; 
    }
    
  ],
  
    
    listeners: [
        {
            name: "onDataUpdate",
            code: function(){
              this.makeCellView();
            }
        },
        {
          name: 'onDragStart',
          code: function(e) {
          e.dataTransfer.setData('application/x-foam-obj-id', this.data.id);
          e.stopPropagation();
          }
        },
      ],
  
});
  
  
foam.CLASS({
  name: 'NewHeroWrapperView',
  extends: 'foam.u2.Element', 
  
  requires: [
    'Team',
    'Hero', ],
  
  imports: [
    
    'HeroDAO',
    'TeamDAO',
  ], 
  
  properties: [
    "of",

    {
        name: 'wrapperView',
        factory: function(){
            return foam.u2.Element.create();
        }
    },
    "status",
    "organizationId",
    "cell", 
    ],
  
  methods: [
    function initE(){
        //this.cssClass(this.myCls()).
        this.
          style({
            'border': '2px solid red', 
            'height':'100%',
            'width':'100%',
            'display':'inline-block',
            }).
          start('div', null, this.content$).
            cssClass(this.myCls('content')).
          end().
          add(this.wrapperView$);
          
        this.on('dragenter', this.onDragOver).
          on('dragover', this.onDragOver).
          on('drop', this.onDrop); 
    },
    
    function makeWrapper(){
        var div = foam.u2.Element.create("div");
        
        div.start(this.NEW, {data: this}).end() ;
          
        this.wrapperView = div; 
    }, 
    
    function init(){
      //this.organizationId$ = this.cell.rowMatchId$;
      this.organizationId$ = this.cell.rowMatchId$;
      this.status$ = this.cell.colMatch$; 
        this.onDAOUpdate();
    },
    

    
  ],
  
  
  
    listeners: [
        {
            name: "onDAOUpdate",
            code: function(){
              this.makeWrapper();
            }
        },
         {
            name: 'onDragOver',
            code: function(e){
                console.log("something is dragged over this shit. ");
                  e.preventDefault();
                  e.stopPropagation();
                
            }
        },
        
        {
            name: 'onDrop',
            code: function(e){
                console.log('something is dumped here. ');
                
                      if ( ! e.dataTransfer.types.some(function(m) { return m === 'application/x-foam-obj-id'; }) )
                    return;
            
                  var id = e.dataTransfer.getData('application/x-foam-obj-id');
                  if (!id ) return;
                  //if ( foam.util.equals(id, this.id) ) return;
            
                  e.preventDefault();
                  e.stopPropagation();
            
                  var self = this; 
                  this.HeroDAO.find(id).then(function(hero){
                      if (! hero){
                        console.log("no valid hero found");
                        return; 
                      }
                      
                      
                      hero.status = self.status;
                      
                      hero.organizationId = self.organizationId?self.organizationId:null;
                      
                      self.HeroDAO.put(hero).then(function(newHero){
                        console.log("Current hero: " + newHero.name + ", " + newHero.status + ", " + newHero.organizationId); 
                      }).then(function(){
                        self.HeroDAO.find(id).then(function(h){
                           console.log(h.name + ", " + h.organizationId);  
                        });
                        
                      });
                  }); 
            }
        }
    ],
    
    actions: [
      {
        name: 'new',
        label: '+',
        code: function(){
          this.HeroDAO.select().then(function(result){
            if (result && result.a ) {
              console.log("HeroDAO present.");
              console.log(result.a.length + " Hero found.");
              console.log("Code here to add Hero of  " + this.team.name + ", " + this.status); 
            }else {
              console.log("Error while getting HeroDAO"); 
            }
          }.bind(this)); 
        }
      }
      
    ]
});



foam.RELATIONSHIP({
  sourceModel: 'Team',
  targetModel: 'Hero',
  forwardName: 'members',
  inverseName: 'organizationId'
});

/**
   NOTE: this file must be loaded after the config
 */
foam.CLASS ((function() {
    var c = {
  name: 'LoadDCWorld',
  exports: [],
  
    requires: [
      "foam.dao.EasyDAO",
      "foam.dao.PromisedDAO",
      ],
    
  implements: [
            'foam.box.Context',
    ],
  
  properties: [
    ],
  
  }; 
    var teams, heroes;
    
     var teamTestData = [
          {name: 'Team Spider', id: 'TS'},
          {name: 'Bats', id:'B'},
          {name: 'Minutemen', id: 'MM'},
          {name: 'Echo Island', id: 'EI'}
        ]; 

    var d = new Date();
    var heroTestData = [
            {
                name: 'May Jane Watson',
                id:'MJW',  organizationId: 'TS', status: 'alive',
                birthDate: new Date(1990, 10, 02),
                lastSeenAlive: (new Date()).setDate( d.getDate() + 6), },
            {name: 'Gwen Stacy', id:'GS',  organizationId: 'TS', status: 'dead',
            lastSeenAlive: (new Date()).setDate( d.getDate() - 10)},
            {name: 'Peter Parker', id: 'PP', organizationId: 'TS', status: 'alive'},
            {name: 'Venom', id: 'V', organizationId: 'TS', status: 'alive'},
            {name: 'Bat Man',  id:'BM',  organizationId: 'B', status: 'alive'},
            {name: 'Alfred', id:'A', organizationId: 'B', status: 'alive'},
            {name: 'Red Hood', id:'RH', organizationId: 'B', status: 'dead',
            lastSeenAlive: (new Date()).setDate( d.getDate() - 5)},
            //currently, undefined can not be matched.
            {name: 'Joker', id:'JK', organizationId: 'B', lastSeenAlive: undefined},
            {name: "Dr. Thomas Wayne", id: "DrWayne", status: 'dead',
            lastSeenAlive: (new Date()).setDate( d.getDate() - 7)},
            {name: "Martha Wayne", id: "MamaWayne", status: 'dead',
            lastSeenAlive: (new Date()).setDate( d.getDate() - 7)},
            {name: "Dr. Manhattan", id: "DrM", organizationId: "MM", status: "MIA",
            lastSeenAlive: (new Date()).setDate( d.getDate() +2)},
            {name: "Roshak", id: "R", organizationId: "MM", status: "dead",
            lastSeenAlive: (new Date()).setDate( d.getDate() - 1)},
            {name: "The Comedian", id: "TC", organizationId: "MM", status: "dead"},
            {name: "Elvis Parsley", id: "EP",
            lastSeenAlive: (new Date()).setDate( d.getDate() + 3)}, 
            {name: "Harry Potter", id:"HP", status: "alive", lastSeenAlive: null},
            {name: "Snape", id: "S", status: "dead", lastSeenAlive: null}, 
            
        ];
    
    var daos = {};
    
    var factoryFct = function(of, daoName, dao, testData){
        return function(){
            dao =  foam.dao.EasyDAO.create({
                of: of,
                daoType: 'MDAO',
                cache: true,
                dedup: true,
                logging: true,
                contextualize: true,
                //testData: testData, 
                }, this);
            
            var promise = dao.removeAll().then( function(){
                return Promise.all( testData.map(function(entry) {
                            var d = of.create(entry, this); 
                            return dao.put(d);
                        }.bind(this)));

                }.bind(this));
            

            console.log("PromisedDAO.create promise PENDING on info: ", of.name);
            var promisedDAO = this.PromisedDAO.create({
                of: of,
                promise: promise.then(
                    function() {
                        console.log("PromisedDAO.create promise RESOLVED on info: ", of.name);
                        return dao;
                    }.bind(this),
                    function(errorEvt) {
                        console.error("PromisedDAO.create promise REJECT on info: ", of.name, 'error:', errorEvt);
                    }.bind(this))
            });
            
            daos[daoName] = promisedDAO;
            return promisedDAO;
        }; 
    };
    
     //teamFactory = factoryFct(Team, "TeamDAO", teams, teamTestData);
    var teamFactory = factoryFct.apply(this, [Team, "TeamDAO", teams, teamTestData]);
    c.exports.push('TeamDAO');
    c.properties.push({name: 'TeamDAO', factory: teamFactory});
    
    var heroFactory = factoryFct.apply(this, [Hero, "HeroDAO", heroes, heroTestData]);
    c.exports.push('HeroDAO');
    c.properties.push({name: 'HeroDAO', factory: heroFactory});
    


    
    return c;
})());
