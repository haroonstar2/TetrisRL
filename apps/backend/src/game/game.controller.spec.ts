import { Test, TestingModule } from '@nestjs/testing';
import { GameController } from './game.controller';
import { GameService } from './game.service';

describe('GameController', () => {
  let controller: GameController;
  let service: GameService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GameController],
      providers: [
        {
          provide: GameService,
          useValue: {
            getNextMove: jest.fn().mockResolvedValue({ action: 'left' }),
          },
        },
      ],
    }).compile();

    controller = module.get<GameController>(GameController);
    service = module.get<GameService>(GameService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('health check should return ok', () => {
    expect(controller.healthCheck()).toEqual({ status: 'ok' });
  });

  it('step should delegate to GameService', async () => {
    const gameState = {
      grid: Array(24).fill(Array(10).fill(0)),
      currentPiece: {
        shape: [[1, 1], [1, 1]],
        x: 4,
        y: 0,
        type: 'O',
      },
      score: 0,
      gameOver: false,
    };
    const result = await controller.step(gameState);
    expect(service.getNextMove).toHaveBeenCalledWith(gameState);
    expect(result).toEqual({ action: 'left' });
  });
});
