"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const common_1 = require("../utils/common");
exports.UserController = {
    createUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { name, email, password, role_id } = req.body;
            try {
                const user = yield prisma_1.default.user.findFirst({
                    where: {
                        email: email,
                    },
                });
                if (user) {
                    return res
                        .status(409)
                        .json({ message: "El usuario ya se encuentra registrado" });
                }
                const hashedPassword = yield bcrypt_1.default.hash(password, 10);
                const uuid = (0, uuid_1.v4)();
                const uuidBuffer = (0, common_1.uuidToBuffer)(uuid);
                const newUser = yield prisma_1.default.user.create({
                    data: {
                        id: uuidBuffer,
                        name: name,
                        email: email,
                        created_at: new Date(),
                        updated_at: new Date(),
                        password: hashedPassword,
                        is_active: true,
                        role_id: Buffer.from(role_id, "hex"),
                    },
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        created_at: true,
                        is_active: true,
                        user_role: {
                            select: {
                                code: true,
                            },
                        },
                    },
                });
                if (!newUser) {
                    return res.status(400).json({ message: "Error al insertar usuario" });
                }
                res.status(200).json(newUser);
            }
            catch (error) {
                return res.status(500).json({ message: "Error de servidor" + error });
            }
        });
    },
    login(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { email, password } = req.body;
            try {
                const user = yield prisma_1.default.user.findFirst({
                    where: {
                        email: email,
                    },
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        password: true,
                        is_active: true,
                        user_role: {
                            select: {
                                code: true,
                            },
                        },
                    },
                });
                if (!user) {
                    return res.status(404).json({ message: "Usuario no encontrado" });
                }
                if (!user.is_active) {
                    return res.status(403).json({ message: "Usuario inactivo" });
                }
                if (yield bcrypt_1.default.compare(password, user.password)) {
                    const token = jsonwebtoken_1.default.sign({ id: (0, common_1.bufferToUuid)(Buffer.from(user.id)), name: user.name, email: user.email, user_role: user.user_role }, process.env.JWT_SECRET || "default_secret");
                    res.status(200).json({ token });
                }
                else {
                    res.status(401).json({ message: "Credenciales inválidas" });
                }
            }
            catch (error) {
                return res.status(500).json({ message: "Error de servidor" + error });
            }
        });
    },
};
