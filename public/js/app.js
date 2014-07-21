
Handlebars.registerHelper("debug", function(optionalValue) {
    console.log("Current Context");
    console.log("====================");
    console.log(this);

    if (optionalValue) {
        console.log("Value");
        console.log("====================");
        console.log(optionalValue);
    }
});

App = Ember.Application.create();


App.AuthenticatedRoute = Ember.Route.extend({


    beforeModel: function(transition) {
        if (!this.controllerFor('login').get('token')) {
            this.redirectToLogin(transition);
        }
    },
    redirectToLogin: function(transition) {
        var loginController = this.controllerFor('login');
        loginController.set('attemptedTransition', transition);
        this.transitionTo('login');
    },

    events: {
        error: function(reason, transition) {
            if (reason.status === 401) {
                this.redirectToLogin(transition);
            } else {
                alert('Something went wrong');
            }
        }
    }
});

/*
 * Task objects
 */
App.Task = Ember.Object.extend();

App.Task.reopenClass({
    all: function() {
        return $.getJSON("http://redeenkind.herokuapp.com/tasks?format=jsonp&callback=?").then(function(response) {
            var tasks = [];
            response.tasks.forEach( function (task) {
                tasks.push( App.Task.create(task) );
            });
            return tasks;
        });
    },
    find: function(task_id){
        return $.ajax
        ({
            type: "GET",
            url: "http://redeenkind.herokuapp.com/tasks/" + task_id,
            dataType: 'jsonp',
            async: false,
            success: function (){
            }
        }).then(function(response) {
            return response.task;
        });
    }
});

/*
 * User objects
 */
App.User = Ember.Object.extend({
});

App.User.reopenClass({
    all: function() {
        return $.ajax
        ({
            type: "GET",
            url: "http://redeenkind.herokuapp.com/users",
            dataType: 'jsonp',
            async: false,
            success: function (){
            }
        }).then(function(response) {
            var users = [];
            response.users.forEach( function (user) {
                users.push( App.Task.create(user) );
            });

            return users;
        });
    },
    find: function(id, token, callback){

        return $.ajax
        ({
            token: token,
            type: "GET",
            contentType: "application/json",
            data: {
                'resolve': 'true'
            },
            async: false,
            url: "http://localhost:5000/users/" + id,
            dataType: 'jsonp',
            success: function (response){
            }
        }).then(function(response) {
            alert(response);
            var savingtargetsByUser = [];
            if(response.user != null && response.user.savingtargets != null && response.user.savingtargets.length > 0)
            {
                response.user.savingtargets.forEach( function (savingtarget) {
                    var moneyNeeded = savingtarget.amount;
                    var moneySaved = 0;
                    savingtarget.tasks.forEach(function(task){
                        task.savingtarget_user_id = savingtarget._id;
                        if(task.completed && !isNaN(task.amount))
                        {
                            moneySaved += parseInt(task.amount);
                        }
                    });
                    savingtarget.money_needed = moneyNeeded;
                    savingtarget.money_saved = moneySaved;
                    savingtarget.money_left = moneyNeeded - moneySaved;

                    now = Math.floor( Date.now() / (3600*24*1000)); //days as integer from..
                    end   = Math.floor( Date.parse(savingtarget.end_date) / (3600*24*1000)); //days as integer from..
                    daysDiff = end - now;// exact dates
                    savingtarget.days_left = daysDiff;
                    savingtargetsByUser.push( App.Task.create(savingtarget) );
                });
            }
            if(callback)
                callback(response.user);
            else
                return response.user;
        });
    },
    findSavingTarget: function(id, savingtarget_id){
        return $.ajax
        ({
            type: "GET",
            contentType: "application/json",
            data: {
                'resolve': 'true'
            },
            async: false,
            url: "http://redeenkind.herokuapp.com/users/" + id,
            dataType: 'jsonp',
            success: function (response){
            }
        }).then(function(response) {
            var currentSavingTarget;
            if(response.user != null && response.user.savingtargets != null && response.user.savingtargets.length > 0)
            {
                response.user.savingtargets.forEach( function (savingtarget) {
                    savingtarget.tasks.forEach(function(task){
                        task.savingtarget_user_id = savingtarget._id;
                    });
                    if(savingtarget._id == savingtarget_id && !savingtarget.completed)
                    {
                        currentSavingTarget = savingtarget;
                        return false;
                    }
                });
            }
            return currentSavingTarget;
        });
    },
    save: function(user, transitionTo){
        //  { "name":"Auto wassen", "short_description" : "Autowassen van je vader", "description" : "Auto wassen is leuk, want auto's zijn tof" }

        return $.ajax
        ({
            type: "PUT",
            url: "http://redeenkind.herokuapp.com/users/" + user._id,
            //dataType: 'json',
            crossDomain: true,
            async: false,
            contentType: "application/json",
            dataType: "json",
            data: JSON.stringify(user),
            success: function (){
            },
            error: function(xhr, status, error) {
            }
        }).then(function(response) {
        });
    }
});

/*
 * SavingTargets -> get saving targets from the server and parse them in an Ember object
 */
App.Doel = Ember.Object.extend({});

App.Doel.reopenClass({
    all: function() {
        return $.ajax({
            type: "GET",
            url: "http://redeenkind.herokuapp.com/savingtargets",
            dataType: 'jsonp',
            async: false,
            username: 'foo',
            password: 'bar',
            success: function (){
            }
        }).then(function(response) {
            var doelenArray = [];
            response.savingtargets.forEach(function(savingtarget) {
                var model = App.Doel.create(savingtarget);
                doelenArray.addObject(model); //fill your array step by step
                //savingtargets.push( App.SavingTarget.create(savingtarget) );
            });
            return doelenArray;
        });
    },
    find: function(savingtarget_id){
        return $.ajax
        ({
            type: "GET",
            url: "http://redeenkind.herokuapp.com/savingtargets/" + savingtarget_id,
            dataType: 'jsonp',
            async: false,
            success: function (){
            }
        }).then(function(response) {
            return response.savingtarget;
        });
    }
});

/*
 * Routes
 */

App.ApplicationRoute = App.AuthenticatedRoute.extend({
    model: function(){
        if(this.controllerFor('login').get('token'))
        {
            var token = this.controllerFor('login').get('token');
            return App.User.find('538314b86cca49020073e969', token);
        }
    }
});

App.DoelenRoute = Ember.Route.extend({
    model: function() {
        return App.Doel.all();
    },
    setupController: function(controller, model){
        controller.set('doelen', model);
    }
});

App.DoelRoute = Ember.Route.extend({
    model: function(params) {
        return App.Doel.find(params.doel_id);
    },
    serialize: function(model, params) {
        return {
            doel_id: model._id
        };
    },
    renderTemplate: function(controller, model){
        //Render header into header outlet
        this.render('doel'),
            this.render('doelDetail', {
                into:'doel',
                outlet: 'detail'
            });
    },
    actions: {
        add : function(){
            this.render('doelSelectDate', {
                into:'doel',
                outlet: 'detail'
            });
        },
        selectDate : function(controller, model){
            var now = new Date(this.currentModel.selectdate);
            var jsonDate = now.toJSON();

            var savingtarget ={
                name: this.currentModel.name,
                savingtarget_id: this.currentModel._id,
                end_date: jsonDate
            };

            var saveModel = true;
            var userModel = App.User.find('538314b86cca49020073e969', function (response) {
                if(response.savingtargets != null)
                {
                    // check if there is a current and not completed savingtarget. If so, adding a new savingtarget is not allowed.
                    var currentSavingTarget = null;
                    response.savingtargets.forEach(function(savingtarget){
                        if(!savingtarget.completed){
                            currentSavingTarget = savingtarget;
                        }
                    });
                    if(currentSavingTarget == null){
                        response.savingtargets.push(savingtarget);
                    } else {
                        saveModel = false;
                    }
                }
                else
                {
                    var savingtargets = [];
                    savingtargets.push(savingtarget);
                    response["savingtargets"] = savingtargets;
                }

                if(saveModel){
                    if(App.User.save(response)){
                        App.Router.transitionTo('doelByUser');
                    }
                }
            });
        }
    }
});

App.DoelByUserRoute = Ember.Route.extend({
    model: function(params) {
        return App.User.findSavingTarget('538314b86cca49020073e969', params.doel_id);
    },
    serialize: function(model, params) {
        return {
            doel_id: model._id
        };
    }
});

/*
 App.KlussenToevoegen = Ember.Route.extend({
 model: function(){
 return App.Task.all();
 },
 setupController: function(controller, model){
 controller.set('klussen', model);
 }
 });
 */
App.KlussenRoute = Ember.Route.extend({
    model: function(){
        return App.Task.all();
    },
    setupController: function(controller, model){
        controller.set('klussenbyuser', model);
    }
});

App.KlusRoute = Ember.Route.extend({
    model: function(params) {
        return App.Task.find(params.klus_id);
    },
    serialize: function(model, params) {
        return {
            klus_id: model._id
        };
    },
    renderTemplate: function(controller, model){
        //Render header into header outlet
        this.render('klus'),
            this.render('klusDetail', {
                into:'klus',
                outlet: 'detail'
            });
    },
    actions: {
        add : function(){
            var window = this;
            var klus ={
                task_id: this.currentModel._id,
                completed_by: this.currentModel.doneBy,
                amount: this.currentModel.amount
            };
            var userModel = App.User.find('538314b86cca49020073e969', function (response) {
                if(response.savingtargets != null)
                {
                    response.savingtargets.forEach(function (savingtarget) {
                        // get the current savingtarget, it's not completed yet
                        if(savingtarget.completed == false)
                        {
                            savingtarget.tasks.push(klus);
                        }
                    });
                }
                App.User.save(response);
                window.transitionTo('klussen');
            });
        }
    }
});

App.KlusBySavingtargetRoute = Ember.Route.extend({
    model: function() {
        return {};
    },
    serialize: function(model, params) {
        return {
            klus_id: model._id
        };
    },
    actions: {
        add : function(){
            var now = new Date();
            var jsonDate = now.toJSON();

            var klus ={
                _id: this.currentModel._id,
                task_id: this.currentModel.task_id,
                completed_by: this.currentModel.doneBy,
                amount: this.currentModel.amount,
                completed: true,
                end_date: jsonDate
            };
            var userModel = App.User.find('538314b86cca49020073e969', function (response) {
                if(response.savingtargets != null)
                {
                    response.savingtargets.forEach(function (savingtarget) {
                        // get the current savingtarget, it's not completed yet
                        if(savingtarget.completed == false)
                        {
                            savingtarget.tasks.forEach(function(task){
                                if(task._id == klus._id)
                                {
                                    task.completed = true;
                                    task.end_date = jsonDate;
                                }
                            });
                        }
                    });
                }
                App.User.save(response);
            });
        }
    }
});

/*
* Authentication
 */
App.LoginRoute = Ember.Route.extend({
    setupController: function(controller, context) {
        controller.reset();
    }
});

// Controllers
App.LoginController = Ember.Controller.extend({

    reset: function() {
        this.setProperties({
            username: "",
            password: "",
            errorMessage: ""
        });
    },

    token: localStorage.token,
    tokenChanged: function() {
        localStorage.token = this.get('token');
    }.observes('token'),

    login: function() {

        var self = this, data = this.getProperties('username', 'password');

        // Clear out any error messages.
        this.set('errorMessage', null);

        $.post('/login', data).then(function(response) {
            self.set('errorMessage', response.message);
            if (response.success) {
                self.set('token', response.token);

                var attemptedTransition = self.get('attemptedTransition');
                if (attemptedTransition) {
                    attemptedTransition.retry();
                    self.set('attemptedTransition', null);
                } else {
                    // Redirect to 'articles' by default.
                    self.transitionToRoute('index');
                }
            }
        });
    }
});

App.Router.map(function() {
    this.resource('doelen', {path: '/doelen'}, function(){
    });
    this.resource('doel', {path: 'doel/:doel_id/'}, function(){});
    this.resource('doelByUser', {path: 'userdoel/:doel_id/'}, function(){});
    //this.resource('adddoel', {path: 'doel/:doel_id/'}, function(){});
    this.route('klussen', {path: '/klussen'}, function(){});
    this.route('klus', {path: 'klus/:klus_id'}, function(){});
    this.route('klusBySavingtarget', {path: 'klusbysavingtarget/:klus_id'}, function(){});
    this.route('login');
    this.route('settings');

});

App.DateField = Ember.TextField.extend({
    type: 'date',
    valueBinding: 'dateValue',
    dateValue: (function(key, value) {
        if (value) {
            return this.set('date', new Date(value));
        } else {
            return (this.get('date') || new Date()).toISOString().substring(0, 10);
        }
    }).property('date')
});


