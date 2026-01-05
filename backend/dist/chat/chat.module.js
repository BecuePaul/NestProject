"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const jwt_1 = require("@nestjs/jwt");
const chat_gateway_1 = require("./chat.gateway");
const chat_service_1 = require("./chat.service");
const user_entity_1 = require("../entities/user.entity");
const room_entity_1 = require("../entities/room.entity");
const message_entity_1 = require("../entities/message.entity");
const room_member_entity_1 = require("../entities/room-member.entity");
const message_reaction_entity_1 = require("../entities/message-reaction.entity");
let ChatModule = class ChatModule {
};
exports.ChatModule = ChatModule;
exports.ChatModule = ChatModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([user_entity_1.User, room_entity_1.Room, message_entity_1.Message, room_member_entity_1.RoomMember, message_reaction_entity_1.MessageReaction]),
            jwt_1.JwtModule.register({
                secret: process.env.JWT_SECRET || 'your-secret-key',
                signOptions: { expiresIn: '7d' },
            }),
        ],
        providers: [chat_gateway_1.ChatGateway, chat_service_1.ChatService],
    })
], ChatModule);
//# sourceMappingURL=chat.module.js.map