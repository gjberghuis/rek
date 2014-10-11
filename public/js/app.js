
App = Ember.Application.create();

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

Handlebars.registerHelper('ifCond', function (v1, operator, v2, options) {

    switch (operator) {
        case '==':
            return (v1 == v2) ? options.fn(this) : options.inverse(this);
        case '===':
            return (v1 === v2) ? options.fn(this) : options.inverse(this);
        case '<':
            return (v1 < v2) ? options.fn(this) : options.inverse(this);
        case '<=':
            return (v1 <= v2) ? options.fn(this) : options.inverse(this);
        case '>':
            return (v1 > v2) ? options.fn(this) : options.inverse(this);
        case '>=':
            return (v1 >= v2) ? options.fn(this) : options.inverse(this);
        case '&&':
            return (v1 && v2) ? options.fn(this) : options.inverse(this);
        case '||':
            return (v1 || v2) ? options.fn(this) : options.inverse(this);
        default:
            return options.inverse(this);
    }
});

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

    getJSONWithToken: function(url) {
        var token = this.controllerFor('login').get('token');
        return $.getJSON(url, { token: token });
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
        return $.getJSON("/tasks?format=jsonp&callback=?", { token: localStorage.getItem('token')}).then(function(response) {
            var tasks = [];
            response.tasks.forEach( function (task) {
                tasks.push( App.Task.create(task) );
            });
            return tasks;
        });
    },
    find: function(task_id){
        return $.getJSON("/tasks/" + task_id, { token: localStorage.getItem('token')}).then(function(response) {
            return response.task;
        });
    },
    save: function(task, callback){
        return $.ajax
        ({
            token: localStorage.getItem('token'),
            type: "POST",
            url: "/tasks/",
            async: false,
            contentType: "application/json",
            dataType: "json",
            data: JSON.stringify(task),
            success: function (){
            },
            error: function(xhr, status, error) {
            }
        }).then(function(response) {
            if(callback)
                callback(response.task);
        });
    }
});

/*
 * User objects
 */
App.User = Ember.Object.extend({
});

App.User.reopenClass({
    find: function(id, callback){
        return $.getJSON("/users/" + id, { token: localStorage.getItem('token'), resolve: true})
            .then(function(response) {
                if(response.user != null && response.user.savingtargets != null && response.user.savingtargets.length > 0)
                {
                    var completedSavingtargets = [];
                    response.user.savingtargets.forEach( function (savingtarget) {
                        savingtarget = CheckMoneySaved(savingtarget);
                        savingtarget = GetDaysLeft(savingtarget);

                        // we need the split the savingtargets in two arrays: completed and not completed

                        if(savingtarget.completed)
                        {
                           completedSavingtargets.push(savingtarget);
                        }
                    });

                    completedSavingtargets.forEach(function(savingtarget){
                        response.user.savingtargets.splice($.inArray(savingtarget, response.user.savingtargets),1);
                    });
                    response.user["completedsavingtargets"] = completedSavingtargets;
                }
                
                if(callback)
                    callback(response.user);
                else
                    return response.user;
            });
    },
    findSavingTarget: function(id, savingtarget_id, callback){
        return $.getJSON("/users/" + id, { token: localStorage.getItem('token'), resolve: true})
            .then(function(response) {
                var currentSavingTarget;
                if(response.user != null && response.user.savingtargets != null && response.user.savingtargets.length > 0)
                {
                    var openSavingTarget;

                    response.user.savingtargets.forEach(function (savingtarget) {
                        var taskUncompletedCount = 0;
                        var taskCompletedCount = 0;

                        var uncompletedTasks = [];
                        var completedTasks = [];
                        savingtarget.tasks.forEach(function(task){
                            if(task.completed)
                            {
                                taskCompletedCount++;
                                completedTasks.push(task);
                            }
                            else
                            {
                                taskUncompletedCount++;
                                uncompletedTasks.push(task);
                            }
                            task.savingtarget_user_id = savingtarget._id;
                        });

                        var counter = 0;
                        uncompletedTasks.forEach(function(task){
                            task.cssClass = GetTaskCssClass(counter);
                            counter++;
                        })
                        completedTasks.forEach(function(task){
                            task.cssClass = GetTaskCssClass(counter);
                            counter++;
                        })

                        savingtarget.completedTasks = completedTasks;
                        savingtarget.unCompletedTasks = uncompletedTasks;
                        savingtarget.taskCompletedCount = taskCompletedCount;
                        savingtarget.taskUncompletedCount = taskUncompletedCount;

                        if(savingtarget._id == savingtarget_id)
                        {
                            savingtarget = CheckMoneySaved(savingtarget);
                            savingtarget = GetDaysLeft(savingtarget);
                            currentSavingTarget = savingtarget;
                            return false;
                        }
                        if(!savingtarget.completed)
                        {
                            openSavingTarget = CheckMoneySaved(savingtarget);
                            openSavingTarget  = GetDaysLeft(savingtarget);
                        }
                    });
                    if (!currentSavingTarget && openSavingTarget)
                        currentSavingTarget = openSavingTarget;

                    if(callback)
                        callback(currentSavingTarget);
                    else
                        return currentSavingTarget;
                }

            });
    },
    save: function(user, callback){
        // add the completed savingtargets back to the savingtargets array
        if(user.completedsavingtargets != null)
        {
            user.completedsavingtargets.forEach(function(savingtarget){
                user.savingtargets.push(savingtarget);
            });
        }

        return $.ajax
        ({
            token: localStorage.getItem('token'),
            type: "PUT",
            url: "/users/" + user._id,
            async: false,
            contentType: "application/json",
            dataType: "json",
            data: JSON.stringify(user),
            success: function (){
            },
            error: function(xhr, status, error) {
            }
        }).then(function(response) {
            if(callback)
                callback(response.user);
        });
    }
});

function GetTaskCssClass(counter){
    var cssClass;
    var firstTaskCssClassGroup = [0,4,8,12,16,20,24,28,32,36,40];
    var secondTaskCssClassGroup = [1,5,9,13,17,21,25,29,33,37,41];
    var thirdTaskCssClassGroup = [2,6,10,14,18,22,26,30,34,38,42];
    var fourthTaskCssClassGroup = [3,7,11,15,19,23,27,31,35,39,43];

    if(counter in firstTaskCssClassGroup)
       cssClass = "firstGroup";
    if(counter in secondTaskCssClassGroup)
        cssClass = "secondGroup";
    if(counter in thirdTaskCssClassGroup)
        cssClass = "thirdGroup";
    if(counter in fourthTaskCssClassGroup)
        cssClass = "fourthGroup";

    return cssClass;
}

function CheckMoneySaved(savingtarget){
    // calculate the money left which is needed to complete the savingtarget
    var moneyNeeded = savingtarget.amount;
    var moneySaved = 0;
    savingtarget.tasks.forEach(function(task){
        task.savingtarget_user_id = savingtarget._id;
        if(task.completed && !isNaN(task.amount) && task.amount != "")
        {
            moneySaved += parseInt(task.amount);
        }
    });
    savingtarget.money_needed = moneyNeeded;
    savingtarget.money_saved = moneySaved;
    savingtarget.money_left = moneyNeeded - moneySaved;
    savingtarget.money_left_needed = savingtarget.money_left > 0 ? true : false;

    // check when the saving are almost there to encourage the user the finish the tasks.
    if(savingtarget.money_left_needed && (savingtarget.money_left <= 3 || savingtarget.money_needed / 5 >= savingtarget.money_left)){
        savingtarget.almostthere = true;
    }
    return savingtarget;
};

function GetDaysLeft(savingtarget){
    // calculate the days left for the savingtarget
    now = Math.floor( Date.now() / (3600*24*1000)); //days as integer from..
    end   = Math.floor( Date.parse(savingtarget.end_date) / (3600*24*1000)); //days as integer from..
    daysDiff = end - now;// exact dates
    savingtarget.days_left = daysDiff;

    return savingtarget;
};

/*
 * SavingTargets -> get saving targets from the server and parse them in an Ember object
 */
App.Doel = Ember.Object.extend({});

App.Doel.reopenClass({
    all: function() {
        return $.getJSON("/savingtargets", { token: localStorage.getItem('token')}).then(function(response) {
            var doelenArray = [];
            response.savingtargets.forEach(function(savingtarget) {
                var model = App.Doel.create(savingtarget);
                doelenArray.addObject(model); //fill your array step by step
            });
            return doelenArray;
        });
    },
    find: function(savingtarget_id){
        $.getJSON("/savingtargets", { token: localStorage.getItem('token')}).then(function(response) {
            return response.savingtarget;
        });
    }
});

/*
 * Routes
 */
App.IndexRoute = App.AuthenticatedRoute.extend({
    model: function(){
        if(this.controllerFor('login').get('token'))
        {
            var user = App.User.findSavingTarget(this.controllerFor('login').get('userid'));
            return user;
        }
    }
});

App.DoelenRoute = App.AuthenticatedRoute.extend({
    model: function() {
        var model = this;
        return App.Doel.all().then(function(doelen){
            return App.User.findSavingTarget(model.controllerFor('login').get('userid')).then(function(user){
                if(user != null)
                {
                    doelen.forEach(function(doel){
                        doel.hasActiveSavingTarget = true;
                    });
                }

                return doelen;
            });
        });
    },
    setupController: function(controller, model){
        controller.set('doelen', model);
    }
});

App.DoelRoute = App.AuthenticatedRoute.extend({
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
            var thisModel = this;

            var savingtarget ={
                name: this.currentModel.name,
                savingtarget_id: this.currentModel._id,
                end_date: jsonDate
            };

            var saveModel = true;
            var userModel = App.User.find(this.controllerFor('login').get('userid'), function (response) {
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
                        thisModel.transitionTo('index');
                    }
                }
            });
        }
    }
});

/*
App.DoelByUserRoute = App.AuthenticatedRoute.extend({
    beforeModel: function(transition) {
        var loginController = this.controllerFor('login');
        loginController.set('previousTransition', transition);
    },
    model: function(params) {
        var user = App.User.findSavingTarget(this.controllerFor('login').get('userid'), params.doel_id);
        return user;
    },
    serialize: function(model, params) {
        return {
            doel_id: model._id
        };
    },
    actions: {
        complete : function(savingtargetid){
            var thisModel = this;
            var savingTargetId;
            var userModel = App.User.find(this.controllerFor('login').get('userid'), function (response) {
                if(response.savingtargets != null)
                {
                    response.savingtargets.forEach(function (savingtarget) {
                        // get the current savingtarget, it's not completed yet
                        if(savingtarget._id == savingtargetid)
                        {
                            savingtarget.completed = true;
                        }
                    });
                }

                App.User.save(response, function(){
                    thisModel.transitionTo('index');
                });
            });
        }
    }
});
*/

App.KlussenRoute = App.AuthenticatedRoute.extend({
    model: function(params) {
        var currentSavingTarget = App.User.findSavingTarget(this.controllerFor('login').get('userid'), params.doel_id);
        return currentSavingTarget;
    }
});

App.KlusAddController = Ember.ObjectController.extend({
    stepOne: true,
    stepTwo: false,
    selectedTask: null
});

App.KlusAddRoute = App.AuthenticatedRoute.extend({
    model: function(params) {
        return App.Task.all();
    },
    actions: {
        toStepTwo: function() {
            this.controller.set('stepOne', false),
            this.controller.set('stepTwo', true)
        },
        save : function(){
            var window = this;
            var savingtargetid;

            var klus ={
                completed_by: this.currentModel.doneBy,
                amount: this.currentModel.amount
            };

            if(this.controller.get('selectedTask') && this.controller.get('selectedTask')._id)
            {
                klus['task_id'] = this.controller.get('selectedTask')._id;
            }
            else
            {
                newKlus = { name: this.currentModel.name };
                App.Task.save(newKlus, function(task){
                   if(task._id)
                   {
                        klus['task_id'] = task._id;
                   }
                   else
                   {
                       this.controller.set('stepOne', true),
                       this.controller.set('stepTwo', false)
                        return false;
                   }
                });
            }

            var thisModel = this;
            var userid = this.controllerFor('login').get('userid');
            var userModel = App.User.find(userid, function (response) {
                if(response.savingtargets != null)
                {
                    response.savingtargets.forEach(function (savingtarget) {
                        // get the current savingtarget, it's not completed yet
                        if(savingtarget.completed == false)
                        {
                            savingtargetid = savingtarget._id;
                            savingtarget.tasks.push(klus);
                        }
                    });
                }

                App.User.save(response, function(){
                    thisModel.controller.set('stepOne', true),
                    thisModel.controller.set('stepTwo', false)
                    thisModel.transitionTo('klussen');
                });
            });
        }
    }

});

App.KlusDoneRoute = App.AuthenticatedRoute.extend({
    serialize: function(model, params) {
        return {
            klus_id: model._id
        };
    },
    model: function(params) {
        if(this.controllerFor('login').get('token'))
        {
            return App.User.findSavingTarget(this.controllerFor('login').get('userid')).then(function(response){
                response.tasks.forEach(function(task){
                    if(task._id == params.klus_id)
                    {
                        response.currentTask = task;
                    }
                });

                return response;
            });
        }
    },
    afterModel: function(savingtarget, transition) {
        var model = this;
        setTimeout(function(){
            if(!savingtarget.completed && savingtarget.money_left <= 0)
            {
                var userModel = App.User.find(model.controllerFor('login').get('userid'), function (response) {
                    if(response.savingtargets != null)
                    {
                        response.savingtargets.forEach(function (responseSavingtarget) {
                            // get the current savingtarget, it's not completed yet
                            if(responseSavingtarget._id == savingtarget._id)
                            {
                                responseSavingtarget.completed = true;
                            }
                        });
                    }

                    App.User.save(response, function(){
                        model.transitionTo('savingTargetDone', savingtarget);
                    });
                });
            }
            else
                model.transitionTo('klussen');
        }, 2000);
    }
});

App.SavingTargetDoneRoute = App.AuthenticatedRoute.extend({
    serialize: function(model, params) {
        return {
            savingtarget_id: model._id
        };
    },
    afterModel: function(savingtarget, transition) {
        var model = this;
        setTimeout(function(){
            model.transitionTo('index');
        }, 2000);
    }
});

App.KlusRoute = App.AuthenticatedRoute.extend({
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
            var savingtargetid;

            var klus ={
                task_id: this.currentModel._id,
                completed_by: this.currentModel.doneBy,
                amount: this.currentModel.amount
            };
            var thisModel = this;
            var userid = this.controllerFor('login').get('userid');
            var userModel = App.User.find(userid, function (response) {
                if(response.savingtargets != null)
                {
                    response.savingtargets.forEach(function (savingtarget) {
                        // get the current savingtarget, it's not completed yet
                        if(savingtarget.completed == false)
                        {
                            savingtargetid = savingtarget._id;
                            savingtarget.tasks.push(klus);
                        }
                    });
                }

                App.User.save(response, function(){
                    thisModel.transitionTo('doelByUser', savingtargetid);
                });
            });
        }
    }
});

App.KlusBySavingtargetRoute = App.AuthenticatedRoute.extend({
    serialize: function(model, params) {
        return {
            klus_id: model._id
        };
    },
    actions: {
        add : function(){
            var now = new Date();
            var jsonDate = now.toJSON();
            var savingtargetid;

            var thisModel = this;
            var userid = this.controllerFor('login').get('userid');

            var klus ={
                _id: this.currentModel._id,
                task_id: this.currentModel.task_id,
                completed_by: this.currentModel.doneBy,
                amount: this.currentModel.amount,
                completed: true,
                end_date: jsonDate
            };
            var userModel = App.User.find(userid, function (response) {
                if(response.savingtargets != null)
                {
                    response.savingtargets.forEach(function (savingtarget) {
                        // get the current savingtarget, it's not completed yet
                        if(savingtarget.completed == false)
                        {
                            savingtargetid = savingtarget._id;
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

                App.User.save(response, function(){
                    thisModel.transitionTo('klusDone', klus._id);
                });
            });
        }
    }
});

App.SettingsRoute = App.AuthenticatedRoute.extend({
    model: function(){
        if(localStorage.getItem('token'))
        {
            return App.User.find(this.controllerFor('login').get('userid'));
        }
    },
    actions: {
        logout : function(){
            this.controllerFor('login').set('token', null);
            this.get('controller').transitionTo('index');
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
    userid: localStorage.userid,
    useridChanged: function() {
        localStorage.userid = this.get('userid');
    }.observes('userid'),

    login: function() {

        var self = this, data = this.getProperties('username', 'password');

        // Clear out any error messages.
        this.set('errorMessage', null);

        $.post('/login', data).then(function(response) {
            self.set('errorMessage', response.message);
            if (response.success) {
                self.set('userid', response.userid);
                self.set('token', response.token);

                var attemptedTransition = self.get('attemptedTransition');
                if (attemptedTransition) {
                    attemptedTransition.retry();
                    self.set('attemptedTransition', null);
                } else {
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
    this.route('klusDone', {path: 'klusdone/:klus_id'}, function(){});
    this.route('savingTargetDone', {path: 'savingtargetdone/:savingtarget_id'}, function(){});
    this.route('klusAddDate', {path: 'klusadddate'}, function(){});
    this.route('klusAdd', {path: 'klusadd'}, function(){});
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


