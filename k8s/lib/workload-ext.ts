import { emptyDir, env, hostPath } from "./pbcloud";
import { ContainerBuilder, WorkloadBuilder } from "./workload";

declare module "./workload" {
  interface ContainerBuilder {
    withLockdownSecurityContext(): ContainerBuilder;
    asLinuxServerWorkload(): WorkloadBuilder;
    asArrWorkload(): WorkloadBuilder;
  }

  interface WorkloadBuilder {
    withConfigMount(): WorkloadBuilder;
    withTmpMount(): WorkloadBuilder;
    withTranscodeMount(): WorkloadBuilder;
    withDownloadsMount(): WorkloadBuilder;
    withTvMount(): WorkloadBuilder;
    withMoviesMount(): WorkloadBuilder;
    withAudiobooksMount(): WorkloadBuilder;
    withMusicMount(): WorkloadBuilder;
  }
}

ContainerBuilder.prototype.withLockdownSecurityContext =
  function (): ContainerBuilder {
    return this.withSecurityContext({
      allowPrivilegeEscalation: false,
      capabilities: { drop: ["all"] },
      privileged: false,
      // NOTE: Failed to create CoreCLR, HRESULT: 0x80004005
      // https://github.com/dotnet/runtime/issues/3168
      readOnlyRootFilesystem: true,
      runAsNonRoot: true,
      runAsUser: 1000,
      runAsGroup: 100,
    });
  };

ContainerBuilder.prototype.asLinuxServerWorkload =
  function (): WorkloadBuilder {
    return this.withEnv(env("TZ", "America/Los_Angeles"))
      .withEnv(env("PUID", "1000"))
      .withEnv(env("PGID", "100"))
      .asWorkload()
      .withExpose()
      .withConfigMount();
  };

ContainerBuilder.prototype.asArrWorkload = function (): WorkloadBuilder {
  return this.withImagePullPolicy("Always")
    .withEnv(env("TZ", "America/Los_Angeles"))
    .withLockdownSecurityContext()
    .asWorkload()
    .withExpose()
    .withTmpMount()
    .withConfigMount();
};

WorkloadBuilder.prototype.withConfigMount = function (): WorkloadBuilder {
  const name = this.getName();
  return this.withVolumeAndMount(
    hostPath("config", `/zssd/general/config/${name}`, "/config"),
  );
};

WorkloadBuilder.prototype.withTmpMount = function (): WorkloadBuilder {
  return this.withVolumeAndMount(emptyDir("tmp", "/tmp"));
};

WorkloadBuilder.prototype.withTranscodeMount = function (): WorkloadBuilder {
  return this.withVolumeAndMount(emptyDir("transcode", "/transcode", true));
};

WorkloadBuilder.prototype.withDownloadsMount = function (): WorkloadBuilder {
  return this.withVolumeAndMount(
    hostPath("downloads", "/data/torrents", "/downloads"),
  );
};

WorkloadBuilder.prototype.withTvMount = function (): WorkloadBuilder {
  return this.withVolumeAndMount(hostPath("tv", "/data/media/tv", "/tv"));
};

WorkloadBuilder.prototype.withMoviesMount = function (): WorkloadBuilder {
  return this.withVolumeAndMount(
    hostPath("movies", "/data/media/movies", "/movies"),
  );
};

WorkloadBuilder.prototype.withAudiobooksMount = function (): WorkloadBuilder {
  return this.withVolumeAndMount(
    hostPath("audiobooks", "/data/media/audiobooks", "/audiobooks"),
  );
};

WorkloadBuilder.prototype.withMusicMount = function (): WorkloadBuilder {
  return this.withVolumeAndMount(
    hostPath("music", "/data/media/music", "/music"),
  );
};
