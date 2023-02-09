import { GitBranch } from './models/git-branch.model';

interface GitLog {
  hash: string;
  message: string;
  authorName: string;
  authorDate: Date;
  authorEmail: string;
  commitDate: Date;
}

interface Repository {
  getBranches: () => Promise<GitBranch[]>;
  deleteBranch: (name: string, force?: boolean) => Promise<void>;
  getRefs: () => Promise<any>;
  checkout: (treeish: string) => Promise<void>;
  log: (options?: { maxEntries: number }) => Promise<GitLog[]>;
  repository: {
    headLabel: string;
  };
}

type GitBranchesQuickPick = {
  label: string;
  description: string;
  current: boolean;
};

export class GitApi {
  private readonly extensionKey = 'vscode.git';
  private readonly extension: any;

  private gitApi: any;
  private repository!: Repository;

  constructor(private readonly vscode: any) {
    this.extension = this.vscode.extensions.getExtension(this.extensionKey);
  }

  async activate(): Promise<void> {
    if (!this.extension) {
      throw new Error('Can not activate git extension');
    }

    return this.extension
      .activate()
      .then((api: { getAPI: (version: number) => any }) => {
        this.gitApi = api.getAPI(1);
        this.repository = this.gitApi.repositories.at(0);
      });
  }

  getCurrentBrach(): string {
    return this.repository.repository.headLabel;
  }

  async getRefs(): Promise<any> {
    return this.repository.getRefs();
  }

  async getData(): Promise<{
    branches: GitBranchesQuickPick[];
    logs: GitLog[];
  }> {
    const branches = await this.repository.getBranches();
    const current = this.getCurrentBrach();
    const logs = await this.getLogs();

    return {
      branches: branches.reduce<GitBranchesQuickPick[]>(
        (acc, { name, commit }) =>
          acc.concat({
            label: name,
            description: commit,
            current: current.startsWith(name),
          }),
        []
      ),
      logs,
    };
  }

  async checkout(text: string): Promise<void> {
    return await this.repository.checkout(text);
  }

  async getLogs() {
    return await this.repository.log();
  }

  async deleteBranch(branch: string): Promise<void> {
    return this.repository.deleteBranch(branch, true);
  }
}
