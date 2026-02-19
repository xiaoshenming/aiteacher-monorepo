import { Router, Request, Response } from "express";
import { authMiddleware, optionalAuth } from "../middleware/auth";
import * as roomService from "../services/roomService";

function getParam(req: Request, name: string): string {
  const val = req.params[name];
  return Array.isArray(val) ? val[0] : (val as string);
}

const router: Router = Router();

// POST /api/rooms — 创建房间
router.post("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { title } = req.body || {};
    const user = req.user!;
    const room = await roomService.createRoom(user.id, `user_${user.id}`, title);
    res.status(201).json({ data: room });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "创建房间失败" });
  }
});

// GET /api/rooms — 我的房间列表
router.get("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const rooms = await roomService.listUserRooms(req.user!.id);
    res.json({ data: rooms });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "获取房间列表失败" });
  }
});

// GET /api/rooms/:id — 房间详情
router.get("/:id", optionalAuth, async (req: Request, res: Response) => {
  try {
    const room = await roomService.getRoom(getParam(req, "id"));
    if (!room) {
      res.status(404).json({ error: "房间不存在" });
      return;
    }

    const userId = req.user?.id;
    if (userId) {
      const isMember = await roomService.isRoomMember(room.id, userId);
      if (isMember) {
        const members = await roomService.getRoomMembers(room.id);
        res.json({ data: { ...room, members } });
        return;
      }
    }

    // 非成员返回预览信息
    res.json({
      data: {
        id: room.id,
        title: room.title,
        creatorName: room.creatorName,
        isActive: room.isActive,
        createdAt: room.createdAt,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "获取房间详情失败" });
  }
});

// PUT /api/rooms/:id — 更新房间（仅创建者）
router.put("/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const room = await roomService.getRoom(getParam(req, "id"));
    if (!room) {
      res.status(404).json({ error: "房间不存在" });
      return;
    }
    if (room.creatorId !== req.user!.id) {
      res.status(403).json({ error: "只有创建者可以修改房间" });
      return;
    }

    const { title, maxMembers, isActive } = req.body || {};
    const updated = await roomService.updateRoom(getParam(req, "id"), { title, maxMembers, isActive });
    res.json({ data: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "更新房间失败" });
  }
});

// DELETE /api/rooms/:id — 删除房间（仅创建者）
router.delete("/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const room = await roomService.getRoom(getParam(req, "id"));
    if (!room) {
      res.status(404).json({ error: "房间不存在" });
      return;
    }
    if (room.creatorId !== req.user!.id) {
      res.status(403).json({ error: "只有创建者可以删除房间" });
      return;
    }

    await roomService.deleteRoom(getParam(req, "id"));
    res.json({ message: "房间已删除" });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "删除房间失败" });
  }
});

// POST /api/rooms/:id/join — 加入房间
router.post("/:id/join", authMiddleware, async (req: Request, res: Response) => {
  try {
    const result = await roomService.joinRoom(getParam(req, "id"), req.user!.id);
    if (!result.ok) {
      res.status(400).json({ error: result.error });
      return;
    }
    res.json({ message: "已加入房间" });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "加入房间失败" });
  }
});

// POST /api/rooms/:id/leave — 离开房间
router.post("/:id/leave", authMiddleware, async (req: Request, res: Response) => {
  try {
    const result = await roomService.leaveRoom(getParam(req, "id"), req.user!.id);
    if (!result.ok) {
      res.status(400).json({ error: result.error });
      return;
    }
    res.json({ message: "已离开房间" });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "离开房间失败" });
  }
});

// DELETE /api/rooms/:id/members/:userId — 踢出成员（仅创建者）
router.delete("/:id/members/:userId", authMiddleware, async (req: Request, res: Response) => {
  try {
    const room = await roomService.getRoom(getParam(req, "id"));
    if (!room) {
      res.status(404).json({ error: "房间不存在" });
      return;
    }
    if (room.creatorId !== req.user!.id) {
      res.status(403).json({ error: "只有创建者可以踢出成员" });
      return;
    }

    const targetUserId = parseInt(getParam(req, "userId"), 10);
    const result = await roomService.kickMember(getParam(req, "id"), targetUserId);
    if (!result.ok) {
      res.status(400).json({ error: result.error });
      return;
    }
    res.json({ message: "成员已被踢出" });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "踢出成员失败" });
  }
});

export default router;
