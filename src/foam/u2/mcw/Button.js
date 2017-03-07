foam.CLASS({
  package: 'foam.u2.mcw',
  name: 'Button',
  extends: 'foam.u2.ActionView',

  methods: [
    function initE() {
      this.
        attrs({type: 'button'}).
        SUPER();
    },

    function initCls() {
      this.cssClass('mdc-button mdc-button--raised mdc-button--primary');
    }
  ]
});
