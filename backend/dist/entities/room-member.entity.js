"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomMember = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const room_entity_1 = require("./room.entity");
let RoomMember = class RoomMember {
    id;
    userId;
    roomId;
    hasHistoryAccess;
    joinedAt;
    user;
    room;
};
exports.RoomMember = RoomMember;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], RoomMember.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid'),
    __metadata("design:type", String)
], RoomMember.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid'),
    __metadata("design:type", String)
], RoomMember.prototype, "roomId", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], RoomMember.prototype, "hasHistoryAccess", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], RoomMember.prototype, "joinedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.roomMemberships),
    (0, typeorm_1.JoinColumn)({ name: 'userId' }),
    __metadata("design:type", user_entity_1.User)
], RoomMember.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => room_entity_1.Room, (room) => room.members),
    (0, typeorm_1.JoinColumn)({ name: 'roomId' }),
    __metadata("design:type", room_entity_1.Room)
], RoomMember.prototype, "room", void 0);
exports.RoomMember = RoomMember = __decorate([
    (0, typeorm_1.Entity)('room_members')
], RoomMember);
//# sourceMappingURL=room-member.entity.js.map