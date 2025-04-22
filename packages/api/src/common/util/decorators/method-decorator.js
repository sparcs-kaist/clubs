"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Employeee = exports.Professor = exports.Executive = exports.Student = exports.Roles = exports.ROLES_KEY = exports.Public = exports.IS_PUBLIC_KEY = void 0;
var common_1 = require("@nestjs/common");
exports.IS_PUBLIC_KEY = "publicMethod";
var Public = function () { return (0, common_1.SetMetadata)(exports.IS_PUBLIC_KEY, true); };
exports.Public = Public;
exports.ROLES_KEY = "roles";
var Roles = function () {
    var roles = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        roles[_i] = arguments[_i];
    }
    return (0, common_1.SetMetadata)(exports.ROLES_KEY, roles);
};
exports.Roles = Roles;
var Student = function () { return (0, exports.Roles)("undergraduate", "master", "doctor"); };
exports.Student = Student;
var Executive = function () { return (0, exports.Roles)("executive"); };
exports.Executive = Executive;
var Professor = function () { return (0, exports.Roles)("professor"); };
exports.Professor = Professor;
var Employeee = function () { return (0, exports.Roles)("employee"); };
exports.Employeee = Employeee;
